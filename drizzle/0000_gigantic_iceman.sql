CREATE TYPE "public"."arabic_dialect" AS ENUM('msa', 'gulf', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."formality" AS ENUM('formal', 'casual', 'warm');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('ar', 'en');--> statement-breakpoint
CREATE TYPE "public"."review_language" AS ENUM('ar', 'en', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."review_source" AS ENUM('google', 'manual', 'import');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'drafted', 'responded', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "daily_digests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"date" text NOT NULL,
	"review_count" integer NOT NULL,
	"urgent_count" integer NOT NULL,
	"summary" text,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"draft_text" text NOT NULL,
	"language" "review_language" NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"edited_text" text,
	"final_text" text,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"google_place_id" text,
	"gbp_account_id" text,
	"gbp_location_id" text,
	"default_language" "review_language" DEFAULT 'ar' NOT NULL,
	"timezone" text DEFAULT 'Asia/Riyadh' NOT NULL,
	"whatsapp_number" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"external_id" text,
	"source" "review_source" NOT NULL,
	"author_name" text,
	"rating" integer NOT NULL,
	"review_text" text NOT NULL,
	"language" "review_language",
	"posted_at" timestamp NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"sentiment" integer,
	"topics" jsonb,
	"urgency" "urgency",
	"status" "review_status" DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"name" text,
	"locale" "locale" DEFAULT 'ar' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "voice_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"formality" "formality" DEFAULT 'warm' NOT NULL,
	"use_religious_phrases" boolean DEFAULT true NOT NULL,
	"arabic_dialect" "arabic_dialect" DEFAULT 'gulf' NOT NULL,
	"custom_instructions" text,
	"sample_responses" jsonb,
	"signoff" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_profiles_restaurant_id_unique" UNIQUE("restaurant_id")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"restaurant_name" text,
	"phone" text,
	"city" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "daily_digests" ADD CONSTRAINT "daily_digests_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_profiles" ADD CONSTRAINT "voice_profiles_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "digests_restaurant_date_idx" ON "daily_digests" USING btree ("restaurant_id","date");--> statement-breakpoint
CREATE INDEX "drafts_review_idx" ON "drafts" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "restaurants_user_idx" ON "restaurants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "restaurants_place_idx" ON "restaurants" USING btree ("google_place_id");--> statement-breakpoint
CREATE INDEX "reviews_restaurant_idx" ON "reviews" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_external_idx" ON "reviews" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "reviews_posted_idx" ON "reviews" USING btree ("posted_at");