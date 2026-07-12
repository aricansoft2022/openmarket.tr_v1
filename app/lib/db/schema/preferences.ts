import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const preferredLanguages = ["tr", "en"] as const;
export const intendedUses = ["buyer", "supplier", "both"] as const;

export type PreferredLanguage = (typeof preferredLanguages)[number];
export type IntendedUse = (typeof intendedUses)[number];

export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    country: text("country").notNull(),
    preferredLanguage: text("preferred_language").$type<PreferredLanguage>().notNull(),
    intendedUse: text("intended_use").$type<IntendedUse>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "user_preferences_country_length_check",
      sql`char_length(trim(${table.country})) between 2 and 80`,
    ),
    check("user_preferences_language_check", sql`${table.preferredLanguage} in ('tr', 'en')`),
    check(
      "user_preferences_intended_use_check",
      sql`${table.intendedUse} in ('buyer', 'supplier', 'both')`,
    ),
  ],
);
