import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';

// User preferences - keyed by WorkOS user ID
export const userPreferences = pgTable('user_preferences', {
  workosUserId: text('workos_user_id').primaryKey(),
  aggressiveness: text('aggressiveness').default('aggressive').notNull(), // conservative | moderate | aggressive
  protectedSenders: jsonb('protected_senders').default([]).$type<string[]>(),
  notifyOnComplete: boolean('notify_on_complete').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;
