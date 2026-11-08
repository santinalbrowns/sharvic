import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { nanoid } from 'nanoid';
import { users } from './users';

export const members = sqliteTable('members', {
  id: text('id').primaryKey().$defaultFn(() => nanoid()),
  memberNo: text('member_no').notNull().unique(),
  userId: text('user_id').references(() => users.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  gender: text('gender', { enum: ['male', 'female', 'other'] }),
  dateOfBirth: integer('date_of_birth', { mode: 'timestamp' }),
  phone: text('phone').notNull(),
  nationalId: text('national_id'),
  address: text('address'),
  nextOfKinName: text('next_of_kin_name'),
  nextOfKinPhone: text('next_of_kin_phone'),
  memberType: text('member_type', { enum: ['member', 'non_member'] }).notNull().default('member'),
  membershipFeePaid: integer('membership_fee_paid', { mode: 'boolean' }).default(false),
  membershipFeeAmount: real('membership_fee_amount').default(50000),
  membershipFeePaidAt: integer('membership_fee_paid_at', { mode: 'timestamp' }),
  status: text('status', { enum: ['active', 'suspended', 'inactive'] }).notNull().default('active'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
