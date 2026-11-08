import { Router } from 'express';
import { db, members, loans, contributions, expenses, loanRepayments } from '@sharvic/db';
import { sql } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import {
  generateBalanceSheet,
  generateIncomeStatement,
  generateGeneralLedger,
  calculateCreditScoreBreakdown,
} from '../utils/financial';

const router = Router();

router.get('/summary', authenticate, async (req, res) => {
  try {
    const totalMembers = await db.select({ count: sql<number>`count(*)` }).from(members);
    const activeMembers = await db.select({ count: sql<number>`count(*)` }).from(members).where(sql`status = 'active'`);
    const totalLoans = await db.select({ count: sql<number>`count(*)` }).from(loans);
    const pendingLoans = await db.select({ count: sql<number>`count(*)` }).from(loans).where(sql`status = 'pending'`);
    const disbursedLoans = await db.select({ count: sql<number>`count(*)` }).from(loans).where(sql`status = 'disbursed'`);
    const totalContributions = await db.select({ sum: sql<number>`coalesce(sum(amount),0)` }).from(contributions);
    const totalLoanAmount = await db.select({ sum: sql<number>`coalesce(sum(principal_amount),0)` }).from(loans).where(sql`status in ('disbursed','completed')`);
    const totalOutstanding = await db.select({ sum: sql<number>`coalesce(sum(outstanding_balance),0)` }).from(loans).where(sql`status = 'disbursed'`);
    const totalRepayments = await db.select({ sum: sql<number>`coalesce(sum(amount),0)` }).from(loanRepayments);
    const totalExpenses = await db.select({ sum: sql<number>`coalesce(sum(amount),0)` }).from(expenses).where(sql`status = 'paid'`);
    res.json({
      totalMembers: totalMembers[0].count,
      activeMembers: activeMembers[0].count,
      totalLoans: totalLoans[0].count,
      pendingLoans: pendingLoans[0].count,
      disbursedLoans: disbursedLoans[0].count,
      totalContributions: totalContributions[0].sum,
      totalLoanAmount: totalLoanAmount[0].sum,
      totalOutstanding: totalOutstanding[0].sum,
      totalRepayments: totalRepayments[0].sum,
      totalExpenses: totalExpenses[0].sum,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

router.get('/loan-performance', authenticate, async (req, res) => {
  const allLoans = await db.query.loans.findMany();
  res.json(allLoans);
});

router.get('/member-statements', authenticate, async (req, res) => {
  const allMembers = await db.query.members.findMany();
  res.json(allMembers);
});

// NEW: Balance Sheet
router.get('/balance-sheet', authenticate, async (req, res) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const balanceSheet = await generateBalanceSheet(asOfDate);
    res.json({
      asOfDate,
      ...balanceSheet,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate balance sheet' });
  }
});

// NEW: Income Statement
router.get('/income-statement', authenticate, async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(endDate.getFullYear(), 0, 1);
    
    const incomeStatement = await generateIncomeStatement(startDate, endDate);
    res.json({
      period: { startDate, endDate },
      ...incomeStatement,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate income statement' });
  }
});

// NEW: General Ledger
router.get('/general-ledger', authenticate, async (req, res) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const ledger = await generateGeneralLedger(startDate, endDate);
    res.json({
      period: { startDate, endDate },
      transactions: ledger,
      totalCount: ledger.length,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate general ledger' });
  }
});

// NEW: Cash Flow Statement
router.get('/cash-flow', authenticate, async (req, res) => {
  try {
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(endDate.getFullYear(), 0, 1);
    
    const ledger = await generateGeneralLedger(startDate, endDate);
    
    // Categorize cash flows
    const operatingActivities = ledger.filter(t => 
      ['contribution', 'loan_repayment', 'expense'].includes(t.type)
    );
    const financingActivities = ledger.filter(t => 
      ['loan_disbursement', 'fee'].includes(t.type)
    );
    
    const operatingCashFlow = operatingActivities.reduce((sum, t) => 
      sum + (t.direction === 'credit' ? t.amount : -t.amount), 0
    );
    const financingCashFlow = financingActivities.reduce((sum, t) => 
      sum + (t.direction === 'credit' ? t.amount : -t.amount), 0
    );
    
    res.json({
      period: { startDate, endDate },
      operatingActivities: {
        transactions: operatingActivities,
        netCashFlow: operatingCashFlow,
      },
      financingActivities: {
        transactions: financingActivities,
        netCashFlow: financingCashFlow,
      },
      netCashChange: operatingCashFlow + financingCashFlow,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to generate cash flow statement' });
  }
});

// NEW: Member Credit Score
router.get('/credit-score/:memberId', authenticate, async (req, res) => {
  try {
    const breakdown = await calculateCreditScoreBreakdown(String(req.params.memberId));
    res.json({ ...breakdown, creditScore: breakdown.score });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate credit score' });
  }
});

// NEW: Credit scores for every member (used by the scoring overview)
router.get('/credit-scores', authenticate, async (req, res) => {
  try {
    const allMembers = await db.query.members.findMany();
    const scores = await Promise.all(
      allMembers.map(async (member) => {
        const breakdown = await calculateCreditScoreBreakdown(member.id);
        return {
          memberId: member.id,
          memberNo: member.memberNo,
          firstName: member.firstName,
          lastName: member.lastName,
          memberType: member.memberType,
          status: member.status,
          creditScore: breakdown.score,
          rating: breakdown.rating,
          factors: breakdown.factors,
        };
      })
    );
    res.json(scores);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate credit scores' });
  }
});

export default router;
