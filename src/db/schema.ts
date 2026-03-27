import { pgTable, serial, text, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'deposit' | 'withdraw'
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  is_voided: boolean('is_voided').default(false),
  created_at: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
});
