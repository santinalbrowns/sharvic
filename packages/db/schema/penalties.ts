import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { loans } from './loans';
import { users } from './users';

export const penalties = sqliteTable('penalties', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  loanId: text('loan_id').notNull().references(() => loans.id),
  amount: real('amount').notNull(),
  reason: text('reason').notNull(),
  status: text('status', { enum: ['pending', 'paid', 'waived'] }).notNull().default('pending'),
  appliedBy: text('applied_by').references(() => users.id),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  waivedBy: text('waived_by').references(() => users.id),
  waivedAt: integer('waived_at', { mode: 'timestamp' }),
  waiverReason: text('waiver_reason'),
  notes: text('notes'),
});

export const loanSchedules = sqliteTable('loan_schedules', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  loanId: text('loan_id').notNull().references(() => loans.id),
  installmentNumber: integer('installment_number').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  principalDue: real('principal_due').notNull(),
  interestDue: real('interest_due').notNull(),
  totalDue: real('total_due').notNull(),
  principalPaid: real('principal_paid').notNull().default(0),
  interestPaid: real('interest_paid').notNull().default(0),
  penaltyPaid: real('penalty_paid').notNull().default(0),
  totalPaid: real('total_paid').notNull().default(0),
  status: text('status', { enum: ['pending', 'paid', 'overdue', 'partial'] }).notNull().default('pending'),
  paidAt: integer('paid_at', { mode: 'timestamp' }),
});

export const creditScores = sqliteTable('credit_scores', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  memberId: text('member_id').notNull(),
  score: real('score').notNull().default(0),
  repaymentHistoryScore: real('repayment_history_score').notNull().default(0),
  outstandingLoansScore: real('outstanding_loans_score').notNull().default(0),
  savingsScore: real('savings_score').notNull().default(0),
  guarantorScore: real('guarantor_score').notNull().default(0),
  membershipDurationScore: real('membership_duration_score').notNull().default(0),
  lastCalculated: integer('last_calculated', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  notes: text('notes'),
});

export type Penalty = typeof penalties.$inferSelect;
export type LoanSchedule = typeof loanSchedules.$inferSelect;
export type CreditScore = typeof creditScores.$inferSelect;
