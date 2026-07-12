CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"country" text NOT NULL,
	"preferred_language" text NOT NULL,
	"intended_use" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_country_length_check" CHECK (char_length(trim("user_preferences"."country")) between 2 and 80),
	CONSTRAINT "user_preferences_language_check" CHECK ("user_preferences"."preferred_language" in ('tr', 'en')),
	CONSTRAINT "user_preferences_intended_use_check" CHECK ("user_preferences"."intended_use" in ('buyer', 'supplier', 'both'))
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;