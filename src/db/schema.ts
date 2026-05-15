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
export const formalityEnum = pgEnum('formality', ['formal', 'casual', 'warm']);
export const arabicDialectEnum = pgEnum('arabic_dialect', ['msa', 'gulf', 'mixed']);

// ===== Users =====
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  name: text('name'),
  locale: localeEnum('locale').notNull().default('ar'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ===== Restaurants =====
// v1 is 1 user = 1 restaurant, but the schema allows future multi-location.
export const restaurants = pgTable(
  'restaurants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(), // Arabic name
    nameEn: text('name_en'),
    googlePlaceId: text('google_place_id'),
    gbpAccountId: text('gbp_account_id'),
    gbpLocationId: text('gbp_location_id'),
    defaultLanguage: reviewLanguageEnum('default_language').notNull().default('ar'),
    timezone: text('timezone').notNull().default('Asia/Riyadh'),
    whatsappNumber: text('whatsapp_number'), // for daily digest delivery
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('restaurants_user_idx').on(t.userId),
    placeIdx: uniqueIndex('restaurants_place_idx').on(t.googlePlaceId),
  })
);

// ===== Voice profiles =====
// How this restaurant sounds when responding. Few-shot examples drive the AI.
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
  // sample responses picked during onboarding, used as few-shot in prompts
  sampleResponses: jsonb('sample_responses').$type<
    Array<{ reviewText: string; rating: number; responseText: string; language: 'ar' | 'en' | 'mixed' }>
  >(),
  signoff: text('signoff'), // e.g. "إدارة مطعم الشام" or "The team at Levant"
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
    externalId: text('external_id'), // GBP review resource name, null for manual
    source: reviewSourceEnum('source').notNull(),
    authorName: text('author_name'),
    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text').notNull(),
    language: reviewLanguageEnum('language'),
    postedAt: timestamp('posted_at').notNull(),
    fetchedAt: timestamp('fetched_at').notNull().defaultNow(),

    // AI analysis
    sentiment: integer('sentiment'), // -2 to 2
    topics: jsonb('topics').$type<string[]>(), // e.g. ["service", "food_quality"]
    urgency: urgencyEnum('urgency'),

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
    finalText: text('final_text'), // what actually got posted
    sentAt: timestamp('sent_at'),
  },
  (t) => ({
    reviewIdx: index('drafts_review_idx').on(t.reviewId),
  })
);

// ===== Daily digests (for idempotency + history) =====
export const dailyDigests = pgTable(
  'daily_digests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    restaurantId: uuid('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD in restaurant timezone
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

// ===== Waitlist (for landing page launches) =====
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
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  user: one(users, { fields: [restaurants.userId], references: [users.id] }),
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
export type Restaurant = typeof restaurants.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type Draft = typeof drafts.$inferSelect;
export type VoiceProfile = typeof voiceProfiles.$inferSelect;
