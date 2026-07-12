CREATE TABLE "business_identity_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text,
	"status" text DEFAULT 'uploading' NOT NULL,
	"failure_reason" text,
	"stored_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_identity_evidence_filename_check" CHECK (char_length(trim("business_identity_evidence"."original_filename")) between 1 and 180),
	CONSTRAINT "business_identity_evidence_object_key_check" CHECK (char_length("business_identity_evidence"."object_key") between 20 and 700),
	CONSTRAINT "business_identity_evidence_mime_check" CHECK ("business_identity_evidence"."mime_type" in ('application/pdf', 'image/jpeg', 'image/png')),
	CONSTRAINT "business_identity_evidence_size_check" CHECK ("business_identity_evidence"."size_bytes" between 1 and 10485760),
	CONSTRAINT "business_identity_evidence_status_check" CHECK ("business_identity_evidence"."status" in ('uploading', 'stored_private', 'failed', 'removed')),
	CONSTRAINT "business_identity_evidence_state_fields_check" CHECK (("business_identity_evidence"."status" = 'uploading' and "business_identity_evidence"."sha256" is null and "business_identity_evidence"."stored_at" is null and "business_identity_evidence"."removed_at" is null and "business_identity_evidence"."failure_reason" is null)
        or ("business_identity_evidence"."status" = 'stored_private' and char_length("business_identity_evidence"."sha256") = 64 and "business_identity_evidence"."stored_at" is not null and "business_identity_evidence"."removed_at" is null and "business_identity_evidence"."failure_reason" is null)
        or ("business_identity_evidence"."status" = 'failed' and "business_identity_evidence"."stored_at" is null and "business_identity_evidence"."removed_at" is null and char_length(trim("business_identity_evidence"."failure_reason")) >= 3)
        or ("business_identity_evidence"."status" = 'removed' and "business_identity_evidence"."removed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "business_identity_evidence" ADD CONSTRAINT "business_identity_evidence_review_id_business_identity_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."business_identity_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_identity_evidence" ADD CONSTRAINT "business_identity_evidence_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_identity_evidence_object_key_idx" ON "business_identity_evidence" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "business_identity_evidence_review_status_idx" ON "business_identity_evidence" USING btree ("review_id","status","created_at");