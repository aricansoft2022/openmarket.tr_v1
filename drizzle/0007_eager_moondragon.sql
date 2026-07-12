CREATE TABLE "production_capabilities" (
	"key" text PRIMARY KEY NOT NULL,
	"label_tr" text NOT NULL,
	"label_en" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "production_capabilities_key_check" CHECK ("production_capabilities"."key" ~ '^production_capability.[a-z0-9_]+$'),
	CONSTRAINT "production_capabilities_label_tr_check" CHECK (char_length(trim("production_capabilities"."label_tr")) between 2 and 120),
	CONSTRAINT "production_capabilities_label_en_check" CHECK (char_length(trim("production_capabilities"."label_en")) between 2 and 120)
);
--> statement-breakpoint
CREATE TABLE "supplier_application_contexts" (
	"company_id" uuid NOT NULL,
	"context_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_application_contexts_company_id_context_key_pk" PRIMARY KEY("company_id","context_key"),
	CONSTRAINT "supplier_application_contexts_key_check" CHECK ("supplier_application_contexts"."context_key" in ('context.home_retail', 'context.hotel_hospitality', 'context.hospital_healthcare_accommodation', 'context.dormitory_institutional_accommodation'))
);
--> statement-breakpoint
CREATE TABLE "supplier_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" text DEFAULT 'supplier_draft' NOT NULL,
	"legal_name" text NOT NULL,
	"trading_name" text,
	"country_code" text NOT NULL,
	"city" text NOT NULL,
	"website" text,
	"description" text,
	"founded_year" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_companies_status_check" CHECK ("supplier_companies"."status" in ('supplier_draft', 'company_documents_required', 'company_documents_pending', 'company_documents_rejected', 'active_supplier', 'reactivation_required', 'suspended_supplier')),
	CONSTRAINT "supplier_companies_legal_name_check" CHECK (char_length(trim("supplier_companies"."legal_name")) between 2 and 200),
	CONSTRAINT "supplier_companies_trading_name_check" CHECK ("supplier_companies"."trading_name" is null or char_length(trim("supplier_companies"."trading_name")) between 2 and 200),
	CONSTRAINT "supplier_companies_country_code_check" CHECK ("supplier_companies"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "supplier_companies_city_check" CHECK (char_length(trim("supplier_companies"."city")) between 2 and 120),
	CONSTRAINT "supplier_companies_description_check" CHECK ("supplier_companies"."description" is null or char_length(trim("supplier_companies"."description")) between 20 and 4000),
	CONSTRAINT "supplier_companies_founded_year_check" CHECK ("supplier_companies"."founded_year" is null or "supplier_companies"."founded_year" between 1800 and 2100)
);
--> statement-breakpoint
CREATE TABLE "supplier_company_types" (
	"company_id" uuid NOT NULL,
	"supplier_type_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_company_types_company_id_supplier_type_key_pk" PRIMARY KEY("company_id","supplier_type_key")
);
--> statement-breakpoint
CREATE TABLE "supplier_export_markets" (
	"company_id" uuid NOT NULL,
	"country_code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_export_markets_company_id_country_code_pk" PRIMARY KEY("company_id","country_code"),
	CONSTRAINT "supplier_export_markets_country_check" CHECK ("supplier_export_markets"."country_code" ~ '^[A-Z]{2}$')
);
--> statement-breakpoint
CREATE TABLE "supplier_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_by" uuid,
	"revoked_at" timestamp with time zone,
	"revocation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_memberships_role_check" CHECK ("supplier_memberships"."role" in ('owner', 'admin', 'editor', 'viewer')),
	CONSTRAINT "supplier_memberships_status_check" CHECK ("supplier_memberships"."status" in ('active', 'revoked')),
	CONSTRAINT "supplier_memberships_state_check" CHECK (("supplier_memberships"."status" = 'active' and "supplier_memberships"."revoked_by" is null and "supplier_memberships"."revoked_at" is null and "supplier_memberships"."revocation_reason" is null)
        or ("supplier_memberships"."status" = 'revoked' and "supplier_memberships"."revoked_by" is not null and "supplier_memberships"."revoked_at" is not null and char_length(trim("supplier_memberships"."revocation_reason")) >= 3))
);
--> statement-breakpoint
CREATE TABLE "supplier_production_capabilities" (
	"company_id" uuid NOT NULL,
	"capability_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_production_capabilities_company_id_capability_key_pk" PRIMARY KEY("company_id","capability_key")
);
--> statement-breakpoint
CREATE TABLE "supplier_types" (
	"key" text PRIMARY KEY NOT NULL,
	"label_tr" text NOT NULL,
	"label_en" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_types_key_check" CHECK ("supplier_types"."key" ~ '^supplier_type.[a-z0-9_]+$'),
	CONSTRAINT "supplier_types_label_tr_check" CHECK (char_length(trim("supplier_types"."label_tr")) between 2 and 120),
	CONSTRAINT "supplier_types_label_en_check" CHECK (char_length(trim("supplier_types"."label_en")) between 2 and 120)
);
--> statement-breakpoint
ALTER TABLE "supplier_application_contexts" ADD CONSTRAINT "supplier_application_contexts_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_companies" ADD CONSTRAINT "supplier_companies_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_company_types" ADD CONSTRAINT "supplier_company_types_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_company_types" ADD CONSTRAINT "supplier_company_types_supplier_type_key_supplier_types_key_fk" FOREIGN KEY ("supplier_type_key") REFERENCES "public"."supplier_types"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_export_markets" ADD CONSTRAINT "supplier_export_markets_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_memberships" ADD CONSTRAINT "supplier_memberships_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_memberships" ADD CONSTRAINT "supplier_memberships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_memberships" ADD CONSTRAINT "supplier_memberships_assigned_by_user_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_memberships" ADD CONSTRAINT "supplier_memberships_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_production_capabilities" ADD CONSTRAINT "supplier_production_capabilities_company_id_supplier_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."supplier_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_production_capabilities" ADD CONSTRAINT "supplier_production_capabilities_capability_key_production_capabilities_key_fk" FOREIGN KEY ("capability_key") REFERENCES "public"."production_capabilities"("key") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplier_application_contexts_context_idx" ON "supplier_application_contexts" USING btree ("context_key","company_id");--> statement-breakpoint
CREATE INDEX "supplier_companies_status_idx" ON "supplier_companies" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "supplier_companies_created_by_idx" ON "supplier_companies" USING btree ("created_by","created_at");--> statement-breakpoint
CREATE INDEX "supplier_company_types_type_idx" ON "supplier_company_types" USING btree ("supplier_type_key","company_id");--> statement-breakpoint
CREATE INDEX "supplier_export_markets_country_idx" ON "supplier_export_markets" USING btree ("country_code","company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "supplier_memberships_company_user_idx" ON "supplier_memberships" USING btree ("company_id","user_id");--> statement-breakpoint
CREATE INDEX "supplier_memberships_user_status_idx" ON "supplier_memberships" USING btree ("user_id","status","company_id");--> statement-breakpoint
CREATE INDEX "supplier_production_capabilities_capability_idx" ON "supplier_production_capabilities" USING btree ("capability_key","company_id");