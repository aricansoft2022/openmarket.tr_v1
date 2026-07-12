CREATE TABLE "platform_staff_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assignment_reason" text NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_by" uuid,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_staff_assignments_role_check" CHECK ("platform_staff_assignments"."role" in ('super_admin', 'platform_admin', 'catalogue_content_editor', 'compliance_reviewer', 'product_rfq_moderator', 'privacy_support_manager')),
	CONSTRAINT "platform_staff_assignments_status_check" CHECK ("platform_staff_assignments"."status" in ('active', 'revoked')),
	CONSTRAINT "platform_staff_assignments_assignment_reason_check" CHECK (char_length(trim("platform_staff_assignments"."assignment_reason")) >= 3),
	CONSTRAINT "platform_staff_assignments_state_fields_check" CHECK (("platform_staff_assignments"."status" = 'active' and "platform_staff_assignments"."revoked_by" is null and "platform_staff_assignments"."revoked_at" is null and "platform_staff_assignments"."revocation_reason" is null)
        or ("platform_staff_assignments"."status" = 'revoked' and "platform_staff_assignments"."revoked_by" is not null and "platform_staff_assignments"."revoked_at" is not null and char_length(trim("platform_staff_assignments"."revocation_reason")) >= 3))
);
--> statement-breakpoint
ALTER TABLE "platform_staff_assignments" ADD CONSTRAINT "platform_staff_assignments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_staff_assignments" ADD CONSTRAINT "platform_staff_assignments_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_staff_assignments" ADD CONSTRAINT "platform_staff_assignments_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "platform_staff_assignments_user_role_idx" ON "platform_staff_assignments" USING btree ("user_id","role");--> statement-breakpoint
CREATE INDEX "platform_staff_assignments_role_status_idx" ON "platform_staff_assignments" USING btree ("role","status","user_id");