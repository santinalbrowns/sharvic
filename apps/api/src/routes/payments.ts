import { Router } from 'express';
import { and, eq, gt, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db, payments, members, loans, savingsAccounts } from '@sharvic/db';
import { authenticate, AuthRequest } from '../middleware/auth';
import {
  MOBILE_MONEY_OPERATORS,
  initiateMobileMoneyCharge,
  isValidWebhookSignature,
  normalizePhoneNumber,
  resolveMobileMoneyOperator,
} from '../services/paychangu';
import {
  applySuccessfulPayment,
  isChargeSuccessful,
  markPaymentFailed,
  refreshPayment,
} from '../services/paymentProcessor';

const router = Router();

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function paymentReference(prefix: string): string {
  return `${prefix}-${Date.now()}-${nanoid(6).toUpperCase()}`;
}

async function resolveMemberForRequest(req: AuthRequest, requestedMemberId?: string) {
  const linkedMember = await db.query.members.findFirst({
    where: eq(members.userId, req.user!.id),
  });

  if (req.user!.role === 'member') {
    if (!linkedMember) {
      throw new HttpError(403, 'No member profile is linked to this account');
    }
    if (requestedMemberId && requestedMemberId !== linkedMember.id) {
      throw new HttpError(403, 'You can only pay for your own account');
    }
    return linkedMember;
  }

  const memberId = requestedMemberId || linkedMember?.id;
  if (!memberId) throw new HttpError(400, 'memberId is required');

  const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
  if (!member) throw new HttpError(404, 'Member not found');
  return member;
}

function parseAmount(value: unknown): number {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, 'Enter a valid payment amount');
  }
  return Math.round(amount * 100) / 100;
}

function parseOperator(value: unknown) {
  if (!value) throw new HttpError(400, 'Select a mobile money operator');
  try {
    return resolveMobileMoneyOperator(String(value));
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : 'Invalid mobile money operator');
  }
}

async function startCharge(params: {
  req: AuthRequest;
  member: Awaited<ReturnType<typeof resolveMemberForRequest>>;
  purpose: 'savings' | 'loan_repayment';
  amount: number;
  phone?: string;
  operator?: string;
  loanId?: string;
}) {
  const operator = parseOperator(params.operator);

  let phone: string;
  try {
    phone = normalizePhoneNumber(params.phone || params.member.phone);
  } catch (e) {
    throw new HttpError(400, e instanceof Error ? e.message : 'Enter a valid mobile money number');
  }

  // Make sure the member can be credited before money leaves their wallet.
  if (params.purpose === 'savings') {
    const account = await db.query.savingsAccounts.findFirst({
      where: eq(savingsAccounts.memberId, params.member.id),
    });
    if (!account) {
      await db.insert(savingsAccounts).values({
        memberId: params.member.id,
        accountNo: `ACC-${nanoid(10).toUpperCase()}`,
        balance: 0,
      });
    }
  }

  const reference = paymentReference(params.purpose === 'savings' ? 'SAV' : 'REP');

  const [payment] = await db.insert(payments).values({
    reference,
    memberId: params.member.id,
    purpose: params.purpose,
    loanId: params.loanId,
    amount: params.amount,
    phone,
    operator: operator.code,
    status: 'pending',
    createdBy: params.req.user!.id,
  }).returning();

  try {
    const charge = await initiateMobileMoneyCharge({
      amount: params.amount,
      phone,
      operatorRefId: operator.refId,
      chargeId: reference,
      firstName: params.member.firstName,
      lastName: params.member.lastName,
    });

    const chargeId = charge.data?.charge_id || reference;
    const [updated] = await db.update(payments)
      .set({ chargeId, updatedAt: new Date() })
      .where(eq(payments.id, payment.id))
      .returning();

    if (isChargeSuccessful(charge)) {
      const completed = await applySuccessfulPayment(payment.id);
      return { payment: completed, message: 'Payment completed successfully.' };
    }

    return {
      payment: updated,
      message: charge.message || 'Payment initiated. Approve the prompt on your phone.',
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to initiate payment';
    console.warn(`PayChangu charge failed (${params.purpose}):`, message);
    await markPaymentFailed(payment.id, message);
    throw new HttpError(400, message);
  }
}

// Mobile money operators supported by PayChangu
router.get('/operators', authenticate, (req, res) => {
  res.json(MOBILE_MONEY_OPERATORS.map(({ code, name }) => ({ code, name })));
});

// Add savings via a mobile money charge
router.post('/savings/initiate', authenticate, async (req: AuthRequest, res) => {
  try {
    const member = await resolveMemberForRequest(req, req.body.memberId);
    const amount = parseAmount(req.body.amount);

    const result = await startCharge({
      req,
      member,
      purpose: 'savings',
      amount,
      phone: req.body.phone,
      operator: req.body.operator,
    });

    res.json(result);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error('Savings payment error:', e);
    res.status(status).json({ error: e instanceof Error ? e.message : 'Failed to start savings payment' });
  }
});

// Repay a loan via a mobile money charge
router.post('/loans/:loanId/repay/initiate', authenticate, async (req: AuthRequest, res) => {
  try {
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, String(req.params.loanId)),
    });
    if (!loan) throw new HttpError(404, 'Loan not found');

    const member = await resolveMemberForRequest(req, req.body.memberId);
    if (loan.memberId !== member.id) {
      throw new HttpError(403, 'This loan does not belong to the selected member');
    }
    if (loan.status !== 'disbursed') {
      throw new HttpError(400, 'This loan is not currently active');
    }

    const amount = parseAmount(req.body.amount);
    if (amount > loan.outstandingBalance) {
      throw new HttpError(
        400,
        `Amount exceeds the outstanding balance of K ${loan.outstandingBalance.toLocaleString()}`
      );
    }

    // Ignore stale pending payments so an abandoned prompt does not block the loan forever.
    const pendingCutoff = new Date(Date.now() - 10 * 60 * 1000);
    const pendingPayment = await db.query.payments.findFirst({
      where: and(
        eq(payments.loanId, loan.id),
        eq(payments.status, 'pending'),
        gt(payments.createdAt, pendingCutoff)
      ),
    });
    if (pendingPayment) {
      throw new HttpError(409, 'A repayment for this loan is already awaiting confirmation');
    }

    const result = await startCharge({
      req,
      member,
      purpose: 'loan_repayment',
      amount,
      phone: req.body.phone,
      operator: req.body.operator,
      loanId: loan.id,
    });

    res.json(result);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error('Loan repayment error:', e);
    res.status(status).json({ error: e instanceof Error ? e.message : 'Failed to start loan repayment' });
  }
});

// Poll a payment. This re-queries PayChangu while the charge is still pending.
router.get('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, String(req.params.id)),
    });
    if (!payment) throw new HttpError(404, 'Payment not found');

    if (req.user!.role === 'member') {
      const linkedMember = await db.query.members.findFirst({
        where: eq(members.userId, req.user!.id),
      });
      if (!linkedMember || payment.memberId !== linkedMember.id) {
        throw new HttpError(403, 'You cannot view this payment');
      }
    }

    let refreshed = payment;
    try {
      refreshed = (await refreshPayment(payment.id)) || payment;
    } catch (e) {
      // Keep the payment pending if PayChangu is temporarily unreachable.
      console.error('Payment status check failed:', e);
    }

    res.json({
      payment: refreshed,
      status: refreshed.status,
      message: refreshed.status === 'successful'
        ? 'Payment confirmed.'
        : refreshed.status === 'failed'
          ? refreshed.failureReason || 'Payment failed.'
          : 'Waiting for payment confirmation.',
    });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error('Payment status error:', e);
    res.status(status).json({ error: e instanceof Error ? e.message : 'Failed to check payment status' });
  }
});

// PayChangu webhook. Configure this URL in the PayChangu dashboard:
// {API_BASE_URL}/api/payments/webhook
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['signature'];
    const rawBody = (req as any).rawBody;

    if (!isValidWebhookSignature(rawBody, Array.isArray(signature) ? signature[0] : signature)) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const payload = req.body || {};
    const chargeId = String(payload.charge_id || payload.chargeId || payload.reference || '');
    const status = String(payload.status || '').toLowerCase();

    if (!chargeId) return res.json({ message: 'Ignored' });

    const payment = await db.query.payments.findFirst({
      where: or(eq(payments.chargeId, chargeId), eq(payments.reference, chargeId)),
    });
    if (!payment) return res.json({ message: 'Ignored' });

    if (['failed', 'cancelled', 'canceled', 'reversed', 'declined'].includes(status)) {
      await markPaymentFailed(payment.id, payload.message || 'Payment failed');
    } else {
      // Always re-query PayChangu before crediting the member.
      await refreshPayment(payment.id);
    }

    res.json({ message: 'Webhook processed' });
  } catch (e) {
    console.error('Payment webhook error:', e);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export default router;
