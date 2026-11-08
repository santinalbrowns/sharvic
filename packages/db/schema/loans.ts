import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { members } from './members';
import { users } from './users';

export const loans = sqliteTable('loans', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  loanNo: text('loan_no').notNull().unique(),
  memberId: text('member_id').notNull().references(() => members.id),
  principalAmount: real('principal_amount').notNull(),
  interestRate: real('interest_rate').notNull(), // 10 for member, 20 for non-member
  interestAmount: real('interest_amount').notNull(),
  totalRepayable: real('total_repayable').notNull(),
  termMonths: integer('term_months').notNull(),
  purpose: text('purpose').notNull(),
  status: text('status', { enum: ['pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed', 'defaulted'] }).notNull().default('pending'),
  appliedAt: integer('applied_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  reviewedBy: text('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  approvedBy: text('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  disbursedBy: text('disbursed_by').references(() => users.id),
  disbursedAt: integer('disbursed_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  outstandingBalance: real('outstanding_balance').notNull().default(0),
  notes: text('notes'),
});

export const loanGuarantors = sqliteTable('loan_guarantors', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  loanId: text('loan_id').notNull().references(() => loans.id),
  guarantorMemberId: text('guarantor_member_id').references(() => members.id),
  guarantorName: text('guarantor_name').notNull(),
  guarantorPhone: text('guarantor_phone').notNull(),
  guarantorNationalId: text('guarantor_national_id'),
  relationship: text('relationship'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const loanRepayments = sqliteTable('loan_repayments', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  loanId: text('loan_id').notNull().references(() => loans.id),
  amount: real('amount').notNull(),
  principalPortion: real('principal_portion'),
  interestPortion: real('interest_portion'),
  penaltyAmount: real('penalty_amount').default(0),
  receiptNo: text('receipt_no').notNull().unique(),
  paymentMethod: text('payment_method', { enum: ['cash', 'mobile_money', 'bank_transfer'] }).default('cash'),
  notes: text('notes'),
  receivedBy: text('received_by').references(() => users.id),
  receivedAt: integer('received_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Loan = typeof loans.$inferSelect;
export type LoanRepayment = typeof loanRepayments.$inferSelect;
