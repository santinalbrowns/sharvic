import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Setting = typeof settings.$inferSelect;
