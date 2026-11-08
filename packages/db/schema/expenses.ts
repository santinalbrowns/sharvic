import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { users } from './users';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  expenseNo: text('expense_no').notNull().unique(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  amount: real('amount').notNull(),
  paidTo: text('paid_to'),
  paymentMethod: text('payment_method', { enum: ['cash', 'mobile_money', 'bank_transfer'] }).default('cash'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'paid'] }).notNull().default('pending'),
  requestedBy: text('requested_by').references(() => users.id),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Expense = typeof expenses.$inferSelect;
