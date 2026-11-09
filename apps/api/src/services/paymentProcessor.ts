import { db, payments, contributions, savingsAccounts, loanRepayments, loans } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { allocateRepayment } from '../utils/financial';
import { verifyMobileMoneyCharge, MobileMoneyChargeResponse } from './paychangu';

const SUCCESS_STATUSES = ['success', 'successful', 'completed'];
const FAILED_STATUSES = ['failed', 'cancelled', 'canceled', 'reversed', 'declined'];

function statusOf(verification: MobileMoneyChargeResponse): string {
  return String(verification?.data?.status || verification?.status || '').toLowerCase();
}

export function isChargeSuccessful(verification: MobileMoneyChargeResponse): boolean {
  return SUCCESS_STATUSES.includes(statusOf(verification));
}

export function isChargeFailed(verification: MobileMoneyChargeResponse): boolean {
  return FAILED_STATUSES.includes(statusOf(verification));
}

export async function markPaymentFailed(paymentId: string, reason: string) {
  const [payment] = await db.update(payments)
    .set({
      status: 'failed',
      failureReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, paymentId))
    .returning();
  return payment;
}

/**
 * Credit a successful payment exactly once. Safe to call repeatedly: each
 * contribution/repayment is keyed by the payment reference.
 */
export async function applySuccessfulPayment(paymentId: string) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) return null;
  if (payment.status === 'successful') return payment;

  const now = new Date();

  if (payment.purpose === 'savings') {
    const existingContribution = await db.query.contributions.findFirst({
      where: eq(contributions.paymentTxRef, payment.reference),
    });

    if (!existingContribution) {
      const account = await db.query.savingsAccounts.findFirst({
        where: eq(savingsAccounts.memberId, payment.memberId),
      });
      if (!account) throw new Error('Savings account not found');

      const contributionMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      await db.insert(contributions).values({
        memberId: payment.memberId,
        savingsAccountId: account.id,
        amount: payment.amount,
        contributionMonth,
        receiptNo: payment.reference,
        notes: 'Mobile money payment via PayChangu',
        receivedBy: payment.createdBy,
        receivedAt: now,
        paymentMethod: 'mobile_money',
        paymentStatus: 'completed',
        paymentTxRef: payment.reference,
      });

      await db.update(savingsAccounts).set({
        balance: account.balance + payment.amount,
        updatedAt: now,
      }).where(eq(savingsAccounts.id, account.id));
    }
  } else if (payment.purpose === 'loan_repayment') {
    if (!payment.loanId) throw new Error('Payment is not linked to a loan');

    const existingRepayment = await db.query.loanRepayments.findFirst({
      where: eq(loanRepayments.receiptNo, payment.reference),
    });

    if (!existingRepayment) {
      const loan = await db.query.loans.findFirst({ where: eq(loans.id, payment.loanId) });
      if (!loan) throw new Error('Loan not found');

      await db.insert(loanRepayments).values({
        loanId: loan.id,
        amount: payment.amount,
        receiptNo: payment.reference,
        paymentMethod: 'mobile_money',
        notes: 'Mobile money payment via PayChangu',
        receivedBy: payment.createdBy,
        receivedAt: now,
      });

      await allocateRepayment(loan.id, payment.amount);

      const newBalance = Math.max(0, loan.outstandingBalance - payment.amount);
      await db.update(loans).set({
        outstandingBalance: newBalance,
        status: newBalance === 0 ? 'completed' : loan.status,
      }).where(eq(loans.id, loan.id));
    }
  }

  const [updated] = await db.update(payments)
    .set({
      status: 'successful',
      failureReason: null,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id))
    .returning();

  return updated;
}

/**
 * Re-query PayChangu for a pending payment and apply the result.
 */
export async function refreshPayment(paymentId: string) {
  const payment = await db.query.payments.findFirst({ where: eq(payments.id, paymentId) });
  if (!payment) return null;
  if (payment.status !== 'pending') return payment;
  if (!payment.chargeId) return payment;

  const verification = await verifyMobileMoneyCharge(payment.chargeId);

  if (isChargeSuccessful(verification)) {
    return applySuccessfulPayment(payment.id);
  }

  if (isChargeFailed(verification)) {
    return markPaymentFailed(
      payment.id,
      verification.message || verification.data?.status || 'Payment failed'
    );
  }

  return payment;
}
