import { Router } from 'express';
import { db, loans, members, loanGuarantors, loanRepayments, penalties, loanSchedules } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';
import {
  checkLoanEligibility,
  generateLoanSchedule,
  allocateRepayment,
  calculatePenalties,
  markOverdueSchedules,
} from '../utils/financial';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const memberId = req.query.memberId ? String(req.query.memberId) : null;
  const all = memberId
    ? await db.query.loans.findMany({ where: eq(loans.memberId, memberId) })
    : await db.query.loans.findMany();
  res.json(all);
});

// NEW: Check loan eligibility before applying
router.post('/check-eligibility', authenticate, async (req, res) => {
  try {
    const { memberId, requestedAmount } = req.body;
    const eligibility = await checkLoanEligibility(memberId, requestedAmount);
    res.json(eligibility);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

router.post('/apply', authenticate, async (req: any, res) => {
  try {
    const { memberId, principalAmount, termMonths, purpose, guarantors } = req.body;
    
    // Check eligibility first
    const eligibility = await checkLoanEligibility(memberId, principalAmount);
    if (!eligibility.eligible) {
      return res.status(400).json({ 
        error: 'Not eligible for loan',
        reasons: eligibility.reasons,
        creditScore: eligibility.creditScore,
      });
    }
    
    const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    const interestRate = member.memberType === 'member' ? 10 : 20;
    const interestAmount = (principalAmount * interestRate) / 100;
    const totalRepayable = principalAmount + interestAmount;
    const loanNo = `LN-${Date.now().toString().slice(-8)}`;
    const [loan] = await db.insert(loans).values({
      loanNo,
      memberId,
      principalAmount,
      interestRate,
      interestAmount,
      totalRepayable,
      termMonths,
      purpose,
      status: 'pending',
      outstandingBalance: totalRepayable,
    }).returning();
    if (guarantors && Array.isArray(guarantors)) {
      for (const g of guarantors) {
        await db.insert(loanGuarantors).values({
          loanId: loan.id,
          guarantorMemberId: g.guarantorMemberId || null,
          guarantorName: g.guarantorName,
          guarantorPhone: g.guarantorPhone,
          guarantorNationalId: g.guarantorNationalId,
          relationship: g.relationship,
        });
      }
    }
    res.json({ ...loan, creditScore: eligibility.creditScore });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to apply for loan' });
  }
});

router.post('/:id/approve', authenticate, authorize('admin', 'chairperson', 'loan_officer'), async (req: any, res) => {
  try {
    const [loan] = await db.update(loans).set({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    }).where(eq(loans.id, String(req.params.id))).returning();
    res.json(loan);
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve loan' });
  }
});

router.post('/:id/disburse', authenticate, authorize('admin', 'chairperson', 'treasurer'), async (req: any, res) => {
  try {
    const [loan] = await db.update(loans).set({
      status: 'disbursed',
      disbursedBy: req.user.id,
      disbursedAt: new Date(),
    }).where(eq(loans.id, String(req.params.id))).returning();
    
    // Generate repayment schedule
    await generateLoanSchedule(loan.id);
    
    res.json(loan);
  } catch (e) {
    res.status(500).json({ error: 'Failed to disburse loan' });
  }
});

router.post('/:id/reject', authenticate, authorize('admin', 'chairperson', 'loan_officer'), async (req: any, res) => {
  try {
    const { reason } = req.body;
    const [loan] = await db.update(loans).set({
      status: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: reason || 'Not specified',
    }).where(eq(loans.id, String(req.params.id))).returning();
    res.json(loan);
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject loan' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, String(req.params.id)) });
  if (!loan) return res.status(404).json({ error: 'Loan not found' });
  const guarantors = await db.query.loanGuarantors.findMany({ where: eq(loanGuarantors.loanId, loan.id) });
  const repayments = await db.query.loanRepayments.findMany({ where: eq(loanRepayments.loanId, loan.id) });
  const schedule = await db.query.loanSchedules?.findMany({ where: eq(loanSchedules.loanId, loan.id) }) || [];
  const loanPenalties = await db.query.penalties?.findMany({ where: eq(penalties.loanId, loan.id) }) || [];
  res.json({ ...loan, guarantors, repayments, schedule, penalties: loanPenalties });
});

router.post('/:id/repay', authenticate, authorize('admin', 'chairperson', 'treasurer', 'loan_officer'), async (req: any, res) => {
  try {
    const { amount, paymentMethod, notes } = req.body;
    const loan = await db.query.loans.findFirst({ where: eq(loans.id, String(req.params.id)) });
    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    if (loan.status !== 'disbursed') return res.status(400).json({ error: 'Loan not disbursed' });
    const receiptNo = `PAY-${Date.now().toString().slice(-10)}`;
    const [repayment] = await db.insert(loanRepayments).values({
      loanId: loan.id,
      amount: parseFloat(amount),
      receiptNo,
      paymentMethod: paymentMethod || 'cash',
      notes,
      receivedBy: req.user.id,
    }).returning();
    
    // Allocate repayment to schedule
    await allocateRepayment(loan.id, parseFloat(amount));
    
    const newBalance = Math.max(0, loan.outstandingBalance - parseFloat(amount));
    await db.update(loans).set({
      outstandingBalance: newBalance,
      status: newBalance === 0 ? 'completed' : loan.status,
    }).where(eq(loans.id, loan.id));
    res.json(repayment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to record repayment' });
  }
});

// NEW: Calculate and apply penalties
router.post('/:id/calculate-penalties', authenticate, authorize('admin', 'chairperson', 'loan_officer'), async (req: any, res) => {
  try {
    const penaltyAmount = await calculatePenalties(String(req.params.id));
    
    if (penaltyAmount > 0) {
      const [penalty] = await db.insert(penalties).values({
        loanId: String(req.params.id),
        amount: penaltyAmount,
        reason: 'Late payment penalty',
        status: 'pending',
        appliedBy: req.user.id,
      }).returning();
      
      res.json({ penalty, message: 'Penalty applied successfully' });
    } else {
      res.json({ penalty: null, message: 'No penalties to apply' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate penalties' });
  }
});

// NEW: Mark overdue schedules (can be run as a cron job)
router.post('/system/mark-overdue', authenticate, authorize('admin'), async (req, res) => {
  try {
    await markOverdueSchedules();
    res.json({ message: 'Overdue schedules marked successfully' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to mark overdue schedules' });
  }
});

export default router;
