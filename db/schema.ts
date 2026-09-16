import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const content = sqliteTable('site_content', {
 id: text('id').primaryKey(),
 body: text('body').notNull(),
 revision: integer('revision').notNull().default(1),
 updatedAt: text('updated_at').notNull(),
});
