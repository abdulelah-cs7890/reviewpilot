import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== Enums =====
export const localeEnum = pgEnum('locale', ['ar', 'en']);
export const reviewSourceEnum = pgEnum('review_source', ['google', 'manual', 'import']);
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'drafted', 'responded', 'ignored']);
export const reviewLanguageEnum = pgEnum('review_language', ['ar', 'en', 'mixed']);
export const urgencyEnum = pgEnum('urgency', ['low', 'medium', 'high']);
export const severityEnum = pgEnum('severity', [
  'urgent_action',
  'direct_reply',
  'monitor',
  'spam',
]);
export const formalityEnum = pgEnum('formality', ['formal', 'casual', 'warm']);
export const arabicDialectEnum = pgEnum('arabic_dialect', ['msa', 'gulf', 'mixed']);

// ===== Auth tables (BetterAuth) =====
// Table names + columns must match BetterAuth's expected shape exactly:
// node_modules/better-auth/node_modules/@better-auth/core/src/db/get-tables.ts
// IDs are text (BetterAuth generates them at insert time), not uuid.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  // our extras
  phone: text('phone'),
  locale: localeEnum('locale').notNull().default('ar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    userIdx: index('session_user_idx').on(t.userId),
  })
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('account_user_idx').on(t.userId),
  })
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    identifierIdx: index('verification_identifier_idx').on(t.identifier),
  })
);

// ===== Restaurants =====
// v1 is 1 user = 1 restaurant, but the schema allows future multi-location.
export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // Arabic name
    nameEn: text('name_en'),
    googlePlaceId: text('google_place_id'),
    gbpAccountId: text('gbp_account_id'),
    gbpLocationId: text('gbp_location_id'),
    defaultLanguage: reviewLanguageEnum('default_language').notNull().default('ar'),
    timezone: text('timezone').notNull().default('Asia/Riyadh'),
    whatsappNumber: text('whatsapp_number'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('restaurants_user_idx').on(t.userId),
    placeIdx: uniqueIndex('restaurants_place_idx').on(t.googlePlaceId),
  })
);

// ===== Voice profiles =====
export const voiceProfiles = pgTable('voice_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantId: uuid('restaurant_id')
    .notNull()
    .unique()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  formality: formalityEnum('formality').notNull().default('warm'),
  useReligiousPhrases: boolean('use_religious_phrases').notNull().default(true),
  arabicDialect: arabicDialectEnum('arabic_dialect').notNull().default('gulf'),
  customInstructions: text('custom_instructions'),
  sampleResponses: jsonb('sample_responses').$type<
    Array<{ reviewText: string; rating: number; responseText: string; language: 'ar' | 'en' | 'mixed' }>
  >(),
  signoff: text('signoff'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===== Reviews =====
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    externalId: text('external_id'),
    source: reviewSourceEnum('source').notNull(),
    authorName: text('author_name'),
    rating: integer('rating').notNull(),
    reviewText: text('review_text').notNull(),
    language: reviewLanguageEnum('language'),
    postedAt: timestamp('posted_at').notNull(),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
    sentiment: integer('sentiment'),
    topics: jsonb('topics').$type<string[]>(),
    urgency: urgencyEnum('urgency'),
    severity: severityEnum('severity'),
    status: reviewStatusEnum('status').notNull().default('pending'),
  },
  (t) => ({
    restaurantIdx: index('reviews_restaurant_idx').on(t.restaurantId),
    statusIdx: index('reviews_status_idx').on(t.status),
    externalIdx: uniqueIndex('reviews_external_idx').on(t.externalId),
    postedIdx: index('reviews_posted_idx').on(t.postedAt),
  })
);

// ===== Drafts =====
export type QualityCheckResult = {
  checks: Array<{
    issue: string;
    addressed: boolean;
    note?: string;
  }>;
  overallScore: number; // 0-100
  language: 'ar' | 'en';
};

export const drafts = pgTable(
  'drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewId: uuid('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    draftText: text('draft_text').notNull(),
    language: reviewLanguageEnum('language').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    generatedAt: timestamp('generated_at').notNull().defaultNow(),
    editedText: text('edited_text'),
    finalText: text('final_text'),
    sentAt: timestamp('sent_at'),
    // Meta-grading from src/ai/quality.ts. Null if the check failed (best-effort)
    // or if the draft predates Phase 4 — UI hides the card in both cases.
    qualityCheck: jsonb('quality_check').$type<QualityCheckResult>(),
    // When set, the publish-scheduled cron flips this draft + parent review
    // to 'responded' once now() >= scheduledFor.
    scheduledFor: timestamp('scheduled_for'),
  },
  (t) => ({
    reviewIdx: index('drafts_review_idx').on(t.reviewId),
  })
);

// ===== Daily digests =====
export const dailyDigests = pgTable(
  'daily_digests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    reviewCount: integer('review_count').notNull(),
    urgentCount: integer('urgent_count').notNull(),
    summary: text('summary'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    uniq: uniqueIndex('digests_restaurant_date_idx').on(t.restaurantId, t.date),
  })
);

// ===== Waitlist =====
export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  restaurantName: text('restaurant_name'),
  phone: text('phone'),
  city: text('city'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ===== Relations =====
export const userRelations = relations(user, ({ many }) => ({
  restaurants: many(restaurants),
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  user: one(user, { fields: [restaurants.userId], references: [user.id] }),
  voiceProfile: one(voiceProfiles, {
    fields: [restaurants.id],
    references: [voiceProfiles.restaurantId],
  }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [reviews.restaurantId], references: [restaurants.id] }),
  drafts: many(drafts),
}));

export const draftsRelations = relations(drafts, ({ one }) => ({
  review: one(reviews, { fields: [drafts.reviewId], references: [reviews.id] }),
}));

// ===== Types =====
export type User = typeof user.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type VoiceProfile = typeof voiceProfiles.$inferSelect;
