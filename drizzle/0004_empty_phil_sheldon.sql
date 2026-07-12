CREATE TABLE "business_identity_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_email_id" uuid,
	"method" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"company_name" text NOT NULL,
	"submitted_domain" text NOT NULL,
	"applicant_note" text,
	"review_note" text,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_identity_reviews_method_check" CHECK ("business_identity_reviews"."method" in ('company_email', 'manual_exception', 'admin_override')),
	CONSTRAINT "business_identity_reviews_status_check" CHECK ("business_identity_reviews"."status" in ('draft', 'pending', 'verified', 'rejected')),
	CONSTRAINT "business_identity_reviews_company_name_check" CHECK (char_length(trim("business_identity_reviews"."company_name")) between 2 and 160),
	CONSTRAINT "business_identity_reviews_domain_lower_check" CHECK ("business_identity_reviews"."submitted_domain" = lower("business_identity_reviews"."submitted_domain")),
	CONSTRAINT "business_identity_reviews_state_timestamp_check" CHECK (("business_identity_reviews"."status" = 'draft' and "business_identity_reviews"."submitted_at" is null and "business_identity_reviews"."reviewed_at" is null)
        or ("business_identity_reviews"."status" = 'pending' and "business_identity_reviews"."submitted_at" is not null and "business_identity_reviews"."reviewed_at" is null)
        or ("business_identity_reviews"."status" in ('verified', 'rejected') and "business_identity_reviews"."submitted_at" is not null and "business_identity_reviews"."reviewed_at" is not null)),
	CONSTRAINT "business_identity_reviews_rejection_reason_check" CHECK (("business_identity_reviews"."status" = 'rejected' and char_length(trim("business_identity_reviews"."rejection_reason")) >= 3)
        or ("business_identity_reviews"."status" <> 'rejected' and "business_identity_reviews"."rejection_reason" is null))
);
--> statement-breakpoint
CREATE TABLE "buyer_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'browser' NOT NULL,
	"business_identity_review_id" uuid,
	"activated_at" timestamp with time zone,
	"suspended_at" timestamp with time zone,
	"suspension_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "buyer_profiles_status_check" CHECK ("buyer_profiles"."status" in ('browser', 'active', 'suspended')),
	CONSTRAINT "buyer_profiles_state_fields_check" CHECK (("buyer_profiles"."status" = 'browser' and "buyer_profiles"."activated_at" is null and "buyer_profiles"."suspended_at" is null and "buyer_profiles"."suspension_reason" is null)
        or ("buyer_profiles"."status" = 'active' and "buyer_profiles"."business_identity_review_id" is not null and "buyer_profiles"."activated_at" is not null and "buyer_profiles"."suspended_at" is null and "buyer_profiles"."suspension_reason" is null)
        or ("buyer_profiles"."status" = 'suspended' and "buyer_profiles"."business_identity_review_id" is not null and "buyer_profiles"."activated_at" is not null and "buyer_profiles"."suspended_at" is not null and char_length(trim("buyer_profiles"."suspension_reason")) >= 3))
);
--> statement-breakpoint
CREATE TABLE "company_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"domain" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"verified_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_emails_email_lower_check" CHECK ("company_emails"."email" = lower("company_emails"."email")),
	CONSTRAINT "company_emails_domain_lower_check" CHECK ("company_emails"."domain" = lower("company_emails"."domain")),
	CONSTRAINT "company_emails_status_check" CHECK ("company_emails"."status" in ('pending', 'verified', 'rejected')),
	CONSTRAINT "company_emails_verified_timestamp_check" CHECK (("company_emails"."status" = 'verified' and "company_emails"."verified_at" is not null and "company_emails"."rejected_at" is null)
        or ("company_emails"."status" = 'rejected' and "company_emails"."rejected_at" is not null and "company_emails"."verified_at" is null)
        or ("company_emails"."status" = 'pending' and "company_emails"."verified_at" is null and "company_emails"."rejected_at" is null))
);
--> statement-breakpoint
CREATE TABLE "email_domain_policies" (
	"domain" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_domain_policies_domain_lower_check" CHECK ("email_domain_policies"."domain" = lower("email_domain_policies"."domain")),
	CONSTRAINT "email_domain_policies_domain_length_check" CHECK (char_length("email_domain_policies"."domain") between 3 and 253),
	CONSTRAINT "email_domain_policies_kind_check" CHECK ("email_domain_policies"."kind" in ('public_email', 'blocked', 'company_exception'))
);
--> statement-breakpoint
ALTER TABLE "business_identity_reviews" ADD CONSTRAINT "business_identity_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_identity_reviews" ADD CONSTRAINT "business_identity_reviews_company_email_id_company_emails_id_fk" FOREIGN KEY ("company_email_id") REFERENCES "public"."company_emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_identity_reviews" ADD CONSTRAINT "business_identity_reviews_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_business_identity_review_id_business_identity_reviews_id_fk" FOREIGN KEY ("business_identity_review_id") REFERENCES "public"."business_identity_reviews"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_emails" ADD CONSTRAINT "company_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_domain_policies" ADD CONSTRAINT "email_domain_policies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "business_identity_reviews_user_status_idx" ON "business_identity_reviews" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "business_identity_reviews_review_queue_idx" ON "business_identity_reviews" USING btree ("status","submitted_at");--> statement-breakpoint
CREATE INDEX "business_identity_reviews_domain_idx" ON "business_identity_reviews" USING btree ("submitted_domain");--> statement-breakpoint
CREATE INDEX "buyer_profiles_status_idx" ON "buyer_profiles" USING btree ("status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "company_emails_user_email_idx" ON "company_emails" USING btree ("user_id","email");--> statement-breakpoint
CREATE INDEX "company_emails_user_status_idx" ON "company_emails" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "company_emails_domain_status_idx" ON "company_emails" USING btree ("domain","status");--> statement-breakpoint
CREATE INDEX "email_domain_policies_kind_idx" ON "email_domain_policies" USING btree ("kind","domain");