import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { users } from './users';

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  transactionNo: text('transaction_no').notNull().unique(),
  type: text('type', { enum: ['contribution', 'loan_disbursement', 'loan_repayment', 'expense', 'fee', 'adjustment'] }).notNull(),
  amount: real('amount').notNull(),
  direction: text('direction', { enum: ['credit', 'debit'] }).notNull(),
  description: text('description').notNull(),
  referenceId: text('reference_id'),
  referenceType: text('reference_type'),
  balanceAfter: real('balance_after'),
  performedBy: text('performed_by').references(() => users.id),
  performedAt: integer('performed_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  userId: text('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  details: text('details'), // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Transaction = typeof transactions.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
