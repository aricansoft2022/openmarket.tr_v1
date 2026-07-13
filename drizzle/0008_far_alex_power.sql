CREATE TABLE "supplier_company_document_types" (
	"key" text PRIMARY KEY NOT NULL,
	"label_tr" text NOT NULL,
	"label_en" text NOT NULL,
	"description_tr" text NOT NULL,
	"description_en" text NOT NULL,
	"public_eligible" boolean DEFAULT false NOT NULL,
	"expiry_expected" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_company_document_types_key_check" CHECK ("supplier_company_document_types"."key" ~ '^company_document[.][a-z0-9_]+$'),
	CONSTRAINT "supplier_company_document_types_label_tr_check" CHECK (char_length(trim("supplier_company_document_types"."label_tr")) between 2 and 160),
	CONSTRAINT "supplier_company_document_types_label_en_check" CHECK (char_length(trim("supplier_company_document_types"."label_en")) between 2 and 160),
	CONSTRAINT "supplier_company_document_types_description_tr_check" CHECK (char_length(trim("supplier_company_document_types"."description_tr")) between 10 and 1000),
	CONSTRAINT "supplier_company_document_types_description_en_check" CHECK (char_length(trim("supplier_company_document_types"."description_en")) between 10 and 1000)
);
--> statement-breakpoint
CREATE TABLE "supplier_company_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_type_key" text NOT NULL,
	"version" integer NOT NULL,
	"replaces_document_id" uuid,
	"uploaded_by" uuid NOT NULL,
	"object_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text,
	"storage_status" text DEFAULT 'uploading' NOT NULL,
	"evidence_status" text DEFAULT 'uploaded' NOT NULL,
	"scan_status" text DEFAULT 'pending' NOT NULL,
	"scan_note" text,
	"issue_date" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"public_visible" boolean DEFAULT false NOT NULL,
	"retention_until" timestamp with time zone,
	"failure_reason" text,
	"stored_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_company_documents_version_check" CHECK ("supplier_company_documents"."version" >= 1),
	CONSTRAINT "supplier_company_documents_filename_check" CHECK (char_length(trim("supplier_company_documents"."original_filename")) between 1 and 180),
	CONSTRAINT "supplier_company_documents_object_key_check" CHECK (char_length("supplier_company_documents"."object_key") between 20 and 700),
	CONSTRAINT "supplier_company_documents_mime_check" CHECK ("supplier_company_documents"."mime_type" in ('application/pdf', 'image/jpeg', 'image/png')),
	CONSTRAINT "supplier_company_documents_size_check" CHECK ("supplier_company_documents"."size_bytes" between 1 and 10485760),
	CONSTRAINT "supplier_company_documents_storage_status_check" CHECK ("supplier_company_documents"."storage_status" in ('uploading', 'stored_private', 'failed', 'removed')),
	CONSTRAINT "supplier_company_documents_evidence_status_check" CHECK ("supplier_company_documents"."evidence_status" in ('uploaded', 'pending_review', 'approved', 'rejected', 'expired', 'replacement_required')),
	CONSTRAINT "supplier_company_documents_scan_status_check" CHECK ("supplier_company_documents"."scan_status" in ('pending', 'clean', 'rejected', 'failed')),
	CONSTRAINT "supplier_company_documents_storage_fields_check" CHECK (("supplier_company_documents"."storage_status" = 'uploading' and "supplier_company_documents"."sha256" is null and "supplier_company_documents"."stored_at" is null and "supplier_company_documents"."removed_at" is null and "supplier_company_documents"."failure_reason" is null)
        or ("supplier_company_documents"."storage_status" = 'stored_private' and char_length("supplier_company_documents"."sha256") = 64 and "supplier_company_documents"."stored_at" is not null and "supplier_company_documents"."removed_at" is null and "supplier_company_documents"."failure_reason" is null)
        or ("supplier_company_documents"."storage_status" = 'failed' and "supplier_company_documents"."stored_at" is null and "supplier_company_documents"."removed_at" is null and char_length(trim("supplier_company_documents"."failure_reason")) >= 3)
        or ("supplier_company_documents"."storage_status" = 'removed' and "supplier_company_documents"."removed_at" is not null)),
	CONSTRAINT "supplier_company_documents_submission_check" CHECK (("supplier_company_documents"."evidence_status" = 'uploaded' and "supplier_company_documents"."submitted_at" is null)
        or ("supplier_company_documents"."evidence_status" <> 'uploaded' and "supplier_company_documents"."submitted_at" is not null)),
	CONSTRAINT "supplier_company_documents_scan_note_check" CHECK (("supplier_company_documents"."scan_status" in ('pending', 'clean') and "supplier_company_documents"."scan_note" is null)
        or ("supplier_company_documents"."scan_status" in ('rejected', 'failed') and char_length(trim("supplier_company_documents"."scan_note")) >= 3)),
	CONSTRAINT "supplier_company_documents_public_visibility_check" CHECK ("supplier_company_documents"."public_visible" = false or ("supplier_company_documents"."evidence_status" = 'approved' and "supplier_company_documents"."storage_status" = 'stored_private')),
	CONSTRAINT "supplier_company_documents_expiry_order_check" CHECK ("supplier_company_documents"."issue_date" is null or "supplier_company_documents"."expires_at" is null or "supplier_company_documents"."expires_at" > "supplier_company_documents"."issue_date")
);
--> statement-breakpoint
CREATE TABLE "supplier_document_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"issued_to" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_accessed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_document_access_grants_token_hash_check" CHECK (char_length("supplier_document_access_grants"."token_hash") = 64),
	CONSTRAINT "supplier_document_access_grants_expiry_check" CHECK ("supplier_document_access_grants"."expires_at" > "supplier_document_access_grants"."created_at"),
	CONSTRAINT "supplier_document_access_grants_revocation_check" CHECK ("supplier_document_access_grants"."revoked_at" is null or "supplier_document_access_grants"."revoked_at" >= "supplier_document_access_grants"."created_at")
);
--> statement-breakpoint
CREATE TABLE "supplier_document_requirement_rules" (
	"key" text PRIMARY KEY NOT NULL,
	"document_type_key" text NOT NULL,
	"supplier_type_key" text,
	"level" text NOT NULL,
	"note_tr" text NOT NULL,
	"note_en" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_document_requirement_rules_key_check" CHECK ("supplier_document_requirement_rules"."key" ~ '^company_document_rule[.][a-z0-9_.]+$'),
	CONSTRAINT "supplier_document_requirement_rules_level_check" CHECK ("supplier_document_requirement_rules"."level" in ('mandatory', 'conditional', 'optional')),
	CONSTRAINT "supplier_document_requirement_rules_note_tr_check" CHECK (char_length(trim("supplier_document_requirement_rules"."note_tr")) between 10 and 1000),
	CONSTRAINT "supplier_document_requirement_rules_note_en_check" CHECK (char_length(trim("supplier_document_requirement_rules"."note_en")) between 10 and 1000)
);
--> statement-breakpoint
CREATE TABLE "supplier_document_review_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"effective_role" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text NOT NULL,
	"review_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_document_review_events_role_check" CHECK ("supplier_document_review_events"."effective_role" in ($1, $2, $3, $4, $5, $6)),
	CONSTRAINT "supplier_document_review_events_decision_check" CHECK ("supplier_document_review_events"."decision" in ('approved', 'rejected', 'replacement_required')),
	CONSTRAINT "supplier_document_review_events_reason_check" CHECK (char_length(trim("supplier_document_review_events"."reason")) between 3 and 2000),
	CONSTRAINT "supplier_document_review_events_note_check" CHECK ("supplier_document_review_events"."review_note" is null or char_length(trim("supplier_document_review_events"."review_note")) between 3 and 4000)
);
--> statement-breakpoint
ALTER TABLE "supplier_company_documents" ADD CONSTRAINT "supplier_company_documents_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_company_documents" ADD CONSTRAINT "supplier_company_documents_document_type_key_supplier_company_document_types_key_fk" FOREIGN KEY ("document_type_key") REFERENCES "public"."supplier_company_document_types"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_company_documents" ADD CONSTRAINT "supplier_company_documents_replaces_document_id_supplier_company_documents_id_fk" FOREIGN KEY ("replaces_document_id") REFERENCES "public"."supplier_company_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_company_documents" ADD CONSTRAINT "supplier_company_documents_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_access_grants" ADD CONSTRAINT "supplier_document_access_grants_document_id_supplier_company_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."supplier_company_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_access_grants" ADD CONSTRAINT "supplier_document_access_grants_issued_to_user_id_fk" FOREIGN KEY ("issued_to") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_requirement_rules" ADD CONSTRAINT "supplier_document_requirement_rules_document_type_key_supplier_company_document_types_key_fk" FOREIGN KEY ("document_type_key") REFERENCES "public"."supplier_company_document_types"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_requirement_rules" ADD CONSTRAINT "supplier_document_requirement_rules_supplier_type_key_supplier_types_key_fk" FOREIGN KEY ("supplier_type_key") REFERENCES "public"."supplier_types"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_review_events" ADD CONSTRAINT "supplier_document_review_events_document_id_supplier_company_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."supplier_company_documents"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_document_review_events" ADD CONSTRAINT "supplier_document_review_events_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplier_company_document_types_active_order_idx" ON "supplier_company_document_types" USING btree ("active","sort_order","key");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_company_documents_object_key_idx" ON "supplier_company_documents" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_company_documents_company_type_version_idx" ON "supplier_company_documents" USING btree ("company_id","document_type_key","version");--> statement-breakpoint
CREATE INDEX "supplier_company_documents_company_status_idx" ON "supplier_company_documents" USING btree ("company_id","document_type_key","evidence_status","created_at");--> statement-breakpoint
CREATE INDEX "supplier_company_documents_review_queue_idx" ON "supplier_company_documents" USING btree ("evidence_status","scan_status","submitted_at");--> statement-breakpoint
CREATE INDEX "supplier_company_documents_expiry_idx" ON "supplier_company_documents" USING btree ("expires_at","evidence_status");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_document_access_grants_token_hash_idx" ON "supplier_document_access_grants" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "supplier_document_access_grants_document_user_idx" ON "supplier_document_access_grants" USING btree ("document_id","issued_to","expires_at");--> statement-breakpoint
CREATE INDEX "supplier_document_requirement_rules_resolution_idx" ON "supplier_document_requirement_rules" USING btree ("active","supplier_type_key","level","sort_order");--> statement-breakpoint
CREATE INDEX "supplier_document_review_events_document_idx" ON "supplier_document_review_events" USING btree ("document_id","created_at");--> statement-breakpoint
CREATE INDEX "supplier_document_review_events_reviewer_idx" ON "supplier_document_review_events" USING btree ("reviewer_id","created_at");