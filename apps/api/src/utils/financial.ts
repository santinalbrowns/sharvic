import { db, loans, loanRepayments, loanSchedules, penalties, contributions, expenses, transactions, members, savingsAccounts, loanGuarantors } from '@sharvic/db';
import { eq, sql, and, lte } from 'drizzle-orm';

/**
 * Calculate penalty for overdue loan installments
 * Default: 2% per week overdue
 */
export async function calculatePenalties(loanId: string): Promise<number> {
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, loanId) });
  if (!loan || loan.status !== 'disbursed') return 0;

  const schedules = await db.query.loanSchedules.findMany({
    where: and(
      eq(loanSchedules.loanId, loanId),
      eq(loanSchedules.status, 'overdue')
    )
  });

  let totalPenalty = 0;
  const now = new Date();

  for (const schedule of schedules) {
    const dueDate = new Date(schedule.dueDate);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const weeksOverdue = Math.floor(daysOverdue / 7);
    
    if (weeksOverdue > 0) {
      const unpaidAmount = schedule.totalDue - schedule.totalPaid;
      const penalty = unpaidAmount * 0.02 * weeksOverdue; // 2% per week
      totalPenalty += penalty;
    }
  }

  return totalPenalty;
}

/**
 * Generate loan repayment schedule
 */
export async function generateLoanSchedule(loanId: string): Promise<void> {
  const loan = await db.query.loans.findFirst({ where: eq(loans.id, loanId) });
  if (!loan) throw new Error('Loan not found');

  // Clear existing schedule
  await db.delete(loanSchedules).where(eq(loanSchedules.loanId, loanId));

  const monthlyPayment = loan.totalRepayable / loan.termMonths;
  const monthlyPrincipal = loan.principalAmount / loan.termMonths;
  const monthlyInterest = loan.interestAmount / loan.termMonths;

  const disbursementDate = loan.disbursedAt || new Date();

  for (let i = 1; i <= loan.termMonths; i++) {
    const dueDate = new Date(disbursementDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    await db.insert(loanSchedules).values({
      loanId: loan.id,
      installmentNumber: i,
      dueDate,
      principalDue: monthlyPrincipal,
      interestDue: monthlyInterest,
      totalDue: monthlyPayment,
      status: 'pending',
    });
  }
}

/**
 * Update loan schedules with repayment allocation
 */
export async function allocateRepayment(loanId: string, amount: number): Promise<void> {
  const schedules = await db.query.loanSchedules.findMany({
    where: and(
      eq(loanSchedules.loanId, loanId),
      sql`${loanSchedules.status} != 'paid'`
    ),
    orderBy: (loanSchedules, { asc }) => [asc(loanSchedules.installmentNumber)]
  });

  let remainingAmount = amount;

  for (const schedule of schedules) {
    if (remainingAmount <= 0) break;

    const unpaid = schedule.totalDue - schedule.totalPaid;
    const payment = Math.min(remainingAmount, unpaid);

    const principalPayment = (payment / schedule.totalDue) * schedule.principalDue;
    const interestPayment = (payment / schedule.totalDue) * schedule.interestDue;

    await db.update(loanSchedules)
      .set({
        principalPaid: schedule.principalPaid + principalPayment,
        interestPaid: schedule.interestPaid + interestPayment,
        totalPaid: schedule.totalPaid + payment,
        status: (schedule.totalPaid + payment) >= schedule.totalDue ? 'paid' : 'partial',
        paidAt: (schedule.totalPaid + payment) >= schedule.totalDue ? new Date() : schedule.paidAt,
      })
      .where(eq(loanSchedules.id, schedule.id));

    remainingAmount -= payment;
  }
}

export type CreditRating = 'excellent' | 'good' | 'fair' | 'poor';

export interface CreditScoreFactor {
  key: 'repaymentHistory' | 'outstandingLoans' | 'savingsConsistency' | 'membershipDuration' | 'guarantorHistory';
  label: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface CreditScoreBreakdown {
  memberId: string;
  score: number;
  rating: CreditRating;
  factors: CreditScoreFactor[];
  calculatedAt: Date;
}

/**
 * Calculate a member's credit score with a per-factor breakdown (0-100 scale)
 */
export async function calculateCreditScoreBreakdown(memberId: string): Promise<CreditScoreBreakdown> {
  const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
  if (!member) {
    return {
      memberId,
      score: 0,
      rating: 'poor',
      factors: [],
      calculatedAt: new Date(),
    };
  }

  // 1. Repayment History (40 points)
  const memberLoans = await db.query.loans.findMany({ where: eq(loans.memberId, memberId) });
  const completedLoans = memberLoans.filter(l => l.status === 'completed').length;
  const defaultedLoans = memberLoans.filter(l => l.status === 'defaulted').length;

  let repaymentScore = 0;
  if (memberLoans.length > 0) {
    repaymentScore = Math.max(0, ((completedLoans / memberLoans.length) * 40) - (defaultedLoans * 10));
  }

  // 2. Outstanding Loans (20 points, -20 when more than 2 active loans)
  const activeLoans = memberLoans.filter(l => l.status === 'disbursed').length;
  let outstandingLoansScore = 0;
  if (activeLoans === 0) outstandingLoansScore = 20;
  else if (activeLoans === 1) outstandingLoansScore = 15;
  else if (activeLoans === 2) outstandingLoansScore = 5;
  else outstandingLoansScore = -20;

  // 3. Savings Consistency (20 points)
  const memberContributions = await db.query.contributions.findMany({
    where: eq(contributions.memberId, memberId)
  });
  let savingsScore = 0;
  if (memberContributions.length >= 12) savingsScore = 20;
  else if (memberContributions.length >= 6) savingsScore = 15;
  else if (memberContributions.length >= 3) savingsScore = 10;

  // 4. Membership Duration (10 points)
  const joinDate = new Date(member.joinedAt ?? Date.now());
  const monthsMember = Math.max(0, Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  let membershipDurationScore = 0;
  if (monthsMember >= 24) membershipDurationScore = 10;
  else if (monthsMember >= 12) membershipDurationScore = 7;
  else if (monthsMember >= 6) membershipDurationScore = 5;

  // 5. Guarantor History (10 points)
  const guaranteedLoans = await db.query.loanGuarantors.findMany({
    where: eq(loanGuarantors.guarantorMemberId, memberId)
  });
  const guarantorScore = guaranteedLoans.length > 0 ? 10 : 0;

  const rawScore =
    repaymentScore +
    outstandingLoansScore +
    savingsScore +
    membershipDurationScore +
    guarantorScore;
  const score = Math.min(100, Math.max(0, rawScore));

  const rating: CreditRating =
    score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';

  return {
    memberId,
    score,
    rating,
    calculatedAt: new Date(),
    factors: [
      {
        key: 'repaymentHistory',
        label: 'Repayment History',
        score: repaymentScore,
        maxScore: 40,
        description: memberLoans.length
          ? `${completedLoans} of ${memberLoans.length} loans completed${defaultedLoans ? `, ${defaultedLoans} defaulted` : ''}`
          : 'No loan history yet',
      },
      {
        key: 'outstandingLoans',
        label: 'Outstanding Loans',
        score: Math.max(0, outstandingLoansScore),
        maxScore: 20,
        description: `${activeLoans} active loan${activeLoans === 1 ? '' : 's'}`,
      },
      {
        key: 'savingsConsistency',
        label: 'Savings Consistency',
        score: savingsScore,
        maxScore: 20,
        description: `${memberContributions.length} contribution${memberContributions.length === 1 ? '' : 's'} recorded`,
      },
      {
        key: 'membershipDuration',
        label: 'Membership Duration',
        score: membershipDurationScore,
        maxScore: 10,
        description: `${monthsMember} month${monthsMember === 1 ? '' : 's'} of membership`,
      },
      {
        key: 'guarantorHistory',
        label: 'Guarantor History',
        score: guarantorScore,
        maxScore: 10,
        description: guaranteedLoans.length
          ? `Guaranteed ${guaranteedLoans.length} loan${guaranteedLoans.length === 1 ? '' : 's'}`
          : 'No guarantor history',
      },
    ],
  };
}

/**
 * Calculate credit score for a member (0-100 scale)
 */
export async function calculateCreditScore(memberId: string): Promise<number> {
  const breakdown = await calculateCreditScoreBreakdown(memberId);
  return breakdown.score;
}

/**
 * Check loan eligibility
 */
export async function checkLoanEligibility(memberId: string, requestedAmount: number): Promise<{
  eligible: boolean;
  reasons: string[];
  creditScore: number;
}> {
  const reasons: string[] = [];
  const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
  
  if (!member) {
    return { eligible: false, reasons: ['Member not found'], creditScore: 0 };
  }

  if (member.status !== 'active') {
    reasons.push('Member account is not active');
  }

  // Check outstanding loans
  const activeLoans = await db.query.loans.findMany({
    where: and(
      eq(loans.memberId, memberId),
      sql`${loans.status} = 'disbursed'`
    )
  });

  if (activeLoans.length >= 2) {
    reasons.push('Maximum active loans limit reached (2)');
  }

  // Check credit score
  const creditScore = await calculateCreditScore(memberId);
  if (creditScore < 40) {
    reasons.push(`Credit score too low: ${creditScore}/100 (minimum 40 required)`);
  }

  // Check if previous loans were defaulted
  const defaultedLoans = await db.query.loans.findMany({
    where: and(
      eq(loans.memberId, memberId),
      eq(loans.status, 'defaulted')
    )
  });

  if (defaultedLoans.length > 0) {
    reasons.push('Has defaulted loans that must be settled first');
  }

  // Check if member has made required contributions
  const memberContributions = await db.query.contributions.findMany({
    where: eq(contributions.memberId, memberId)
  });

  if (memberContributions.length < 3) {
    reasons.push('Minimum 3 months contributions required');
  }

  const eligible = reasons.length === 0;
  return { eligible, reasons, creditScore };
}

/**
 * Mark overdue loan schedules
 */
export async function markOverdueSchedules(): Promise<void> {
  const now = new Date();
  await db.update(loanSchedules)
    .set({ status: 'overdue' })
    .where(
      and(
        lte(loanSchedules.dueDate, now),
        sql`${loanSchedules.status} = 'pending'`,
        sql`${loanSchedules.totalPaid} < ${loanSchedules.totalDue}`
      )
    );
}

/**
 * Generate Balance Sheet
 */
export async function generateBalanceSheet(asOfDate: Date = new Date()): Promise<{
  assets: { cash: number; loansReceivable: number; total: number };
  liabilities: { memberSavings: number; total: number };
  equity: { retainedEarnings: number; total: number };
}> {
  // Assets
  const cashTransactions = await db.select({ 
    total: sql<number>`coalesce(sum(case when direction='credit' then amount else -amount end), 0)` 
  }).from(transactions);
  
  const loansReceivable = await db.select({ 
    total: sql<number>`coalesce(sum(outstanding_balance), 0)` 
  }).from(loans).where(eq(loans.status, 'disbursed'));

  const cash = cashTransactions[0]?.total || 0;
  const loansReceivableAmount = loansReceivable[0]?.total || 0;
  const totalAssets = cash + loansReceivableAmount;

  // Liabilities
  const memberSavings = await db.select({ 
    total: sql<number>`coalesce(sum(balance), 0)` 
  }).from(savingsAccounts);
  const memberSavingsAmount = memberSavings[0]?.total || 0;

  // Equity (Retained Earnings = Total Assets - Total Liabilities)
  const retainedEarnings = totalAssets - memberSavingsAmount;

  return {
    assets: {
      cash,
      loansReceivable: loansReceivableAmount,
      total: totalAssets,
    },
    liabilities: {
      memberSavings: memberSavingsAmount,
      total: memberSavingsAmount,
    },
    equity: {
      retainedEarnings,
      total: retainedEarnings,
    },
  };
}

/**
 * Generate Income Statement
 */
export async function generateIncomeStatement(startDate: Date, endDate: Date): Promise<{
  revenue: { interestIncome: number; membershipFees: number; total: number };
  expenses: { operatingExpenses: number; total: number };
  netIncome: number;
}> {
  // Interest Income
  const interestIncome = await db.select({ 
    total: sql<number>`coalesce(sum(interest_amount), 0)` 
  }).from(loans).where(
    and(
      sql`${loans.status} in ('completed', 'disbursed')`,
      sql`${loans.disbursedAt} >= ${startDate.getTime()}`,
      sql`${loans.disbursedAt} <= ${endDate.getTime()}`
    )
  );

  // Membership Fees
  const membershipFees = await db.select({ 
    total: sql<number>`coalesce(sum(amount), 0)` 
  }).from(transactions).where(
    and(
      eq(transactions.type, 'fee'),
      sql`${transactions.performedAt} >= ${startDate.getTime()}`,
      sql`${transactions.performedAt} <= ${endDate.getTime()}`
    )
  );

  // Operating Expenses
  const operatingExpenses = await db.select({ 
    total: sql<number>`coalesce(sum(amount), 0)` 
  }).from(expenses).where(
    and(
      eq(expenses.status, 'paid'),
      sql`${expenses.paidAt} >= ${startDate.getTime()}`,
      sql`${expenses.paidAt} <= ${endDate.getTime()}`
    )
  );

  const totalRevenue = (interestIncome[0]?.total || 0) + (membershipFees[0]?.total || 0);
  const totalExpenses = operatingExpenses[0]?.total || 0;
  const netIncome = totalRevenue - totalExpenses;

  return {
    revenue: {
      interestIncome: interestIncome[0]?.total || 0,
      membershipFees: membershipFees[0]?.total || 0,
      total: totalRevenue,
    },
    expenses: {
      operatingExpenses: totalExpenses,
      total: totalExpenses,
    },
    netIncome,
  };
}

/**
 * Generate General Ledger
 */
export async function generateGeneralLedger(startDate?: Date, endDate?: Date): Promise<any[]> {
  let query = db.select().from(transactions);
  
  if (startDate && endDate) {
    query = query.where(
      and(
        sql`${transactions.performedAt} >= ${startDate.getTime()}`,
        sql`${transactions.performedAt} <= ${endDate.getTime()}`
      )
    ) as any;
  }

  const ledgerEntries = await query;
  return ledgerEntries.sort((a, b) => 
    new Date(b.performedAt ?? 0).getTime() - new Date(a.performedAt ?? 0).getTime()
  );
}
