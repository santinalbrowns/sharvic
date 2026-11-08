"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePenalties = calculatePenalties;
exports.generateLoanSchedule = generateLoanSchedule;
exports.allocateRepayment = allocateRepayment;
exports.calculateCreditScoreBreakdown = calculateCreditScoreBreakdown;
exports.calculateCreditScore = calculateCreditScore;
exports.checkLoanEligibility = checkLoanEligibility;
exports.markOverdueSchedules = markOverdueSchedules;
exports.generateBalanceSheet = generateBalanceSheet;
exports.generateIncomeStatement = generateIncomeStatement;
exports.generateGeneralLedger = generateGeneralLedger;
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Calculate penalty for overdue loan installments
 * Default: 2% per week overdue
 */
async function calculatePenalties(loanId) {
    const loan = await db_1.db.query.loans.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.loans.id, loanId) });
    if (!loan || loan.status !== 'disbursed')
        return 0;
    const schedules = await db_1.db.query.loanSchedules.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.loanSchedules.loanId, loanId), (0, drizzle_orm_1.eq)(db_1.loanSchedules.status, 'overdue'))
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
async function generateLoanSchedule(loanId) {
    const loan = await db_1.db.query.loans.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.loans.id, loanId) });
    if (!loan)
        throw new Error('Loan not found');
    // Clear existing schedule
    await db_1.db.delete(db_1.loanSchedules).where((0, drizzle_orm_1.eq)(db_1.loanSchedules.loanId, loanId));
    const monthlyPayment = loan.totalRepayable / loan.termMonths;
    const monthlyPrincipal = loan.principalAmount / loan.termMonths;
    const monthlyInterest = loan.interestAmount / loan.termMonths;
    const disbursementDate = loan.disbursedAt || new Date();
    for (let i = 1; i <= loan.termMonths; i++) {
        const dueDate = new Date(disbursementDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        await db_1.db.insert(db_1.loanSchedules).values({
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
async function allocateRepayment(loanId, amount) {
    const schedules = await db_1.db.query.loanSchedules.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.loanSchedules.loanId, loanId), (0, drizzle_orm_1.sql) `${db_1.loanSchedules.status} != 'paid'`),
        orderBy: (loanSchedules, { asc }) => [asc(loanSchedules.installmentNumber)]
    });
    let remainingAmount = amount;
    for (const schedule of schedules) {
        if (remainingAmount <= 0)
            break;
        const unpaid = schedule.totalDue - schedule.totalPaid;
        const payment = Math.min(remainingAmount, unpaid);
        const principalPayment = (payment / schedule.totalDue) * schedule.principalDue;
        const interestPayment = (payment / schedule.totalDue) * schedule.interestDue;
        await db_1.db.update(db_1.loanSchedules)
            .set({
            principalPaid: schedule.principalPaid + principalPayment,
            interestPaid: schedule.interestPaid + interestPayment,
            totalPaid: schedule.totalPaid + payment,
            status: (schedule.totalPaid + payment) >= schedule.totalDue ? 'paid' : 'partial',
            paidAt: (schedule.totalPaid + payment) >= schedule.totalDue ? new Date() : schedule.paidAt,
        })
            .where((0, drizzle_orm_1.eq)(db_1.loanSchedules.id, schedule.id));
        remainingAmount -= payment;
    }
}
/**
 * Calculate a member's credit score with a per-factor breakdown (0-100 scale)
 */
async function calculateCreditScoreBreakdown(memberId) {
    const member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.id, memberId) });
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
    const memberLoans = await db_1.db.query.loans.findMany({ where: (0, drizzle_orm_1.eq)(db_1.loans.memberId, memberId) });
    const completedLoans = memberLoans.filter(l => l.status === 'completed').length;
    const defaultedLoans = memberLoans.filter(l => l.status === 'defaulted').length;
    let repaymentScore = 0;
    if (memberLoans.length > 0) {
        repaymentScore = Math.max(0, ((completedLoans / memberLoans.length) * 40) - (defaultedLoans * 10));
    }
    // 2. Outstanding Loans (20 points, -20 when more than 2 active loans)
    const activeLoans = memberLoans.filter(l => l.status === 'disbursed').length;
    let outstandingLoansScore = 0;
    if (activeLoans === 0)
        outstandingLoansScore = 20;
    else if (activeLoans === 1)
        outstandingLoansScore = 15;
    else if (activeLoans === 2)
        outstandingLoansScore = 5;
    else
        outstandingLoansScore = -20;
    // 3. Savings Consistency (20 points)
    const memberContributions = await db_1.db.query.contributions.findMany({
        where: (0, drizzle_orm_1.eq)(db_1.contributions.memberId, memberId)
    });
    let savingsScore = 0;
    if (memberContributions.length >= 12)
        savingsScore = 20;
    else if (memberContributions.length >= 6)
        savingsScore = 15;
    else if (memberContributions.length >= 3)
        savingsScore = 10;
    // 4. Membership Duration (10 points)
    const joinDate = new Date(member.joinedAt ?? Date.now());
    const monthsMember = Math.max(0, Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    let membershipDurationScore = 0;
    if (monthsMember >= 24)
        membershipDurationScore = 10;
    else if (monthsMember >= 12)
        membershipDurationScore = 7;
    else if (monthsMember >= 6)
        membershipDurationScore = 5;
    // 5. Guarantor History (10 points)
    const guaranteedLoans = await db_1.db.query.loanGuarantors.findMany({
        where: (0, drizzle_orm_1.eq)(db_1.loanGuarantors.guarantorMemberId, memberId)
    });
    const guarantorScore = guaranteedLoans.length > 0 ? 10 : 0;
    const rawScore = repaymentScore +
        outstandingLoansScore +
        savingsScore +
        membershipDurationScore +
        guarantorScore;
    const score = Math.min(100, Math.max(0, rawScore));
    const rating = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
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
async function calculateCreditScore(memberId) {
    const breakdown = await calculateCreditScoreBreakdown(memberId);
    return breakdown.score;
}
/**
 * Check loan eligibility
 */
async function checkLoanEligibility(memberId, requestedAmount) {
    const reasons = [];
    const member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.id, memberId) });
    if (!member) {
        return { eligible: false, reasons: ['Member not found'], creditScore: 0 };
    }
    if (member.status !== 'active') {
        reasons.push('Member account is not active');
    }
    // Check outstanding loans
    const activeLoans = await db_1.db.query.loans.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.loans.memberId, memberId), (0, drizzle_orm_1.sql) `${db_1.loans.status} = 'disbursed'`)
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
    const defaultedLoans = await db_1.db.query.loans.findMany({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.loans.memberId, memberId), (0, drizzle_orm_1.eq)(db_1.loans.status, 'defaulted'))
    });
    if (defaultedLoans.length > 0) {
        reasons.push('Has defaulted loans that must be settled first');
    }
    // Check if member has made required contributions
    const memberContributions = await db_1.db.query.contributions.findMany({
        where: (0, drizzle_orm_1.eq)(db_1.contributions.memberId, memberId)
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
async function markOverdueSchedules() {
    const now = new Date();
    await db_1.db.update(db_1.loanSchedules)
        .set({ status: 'overdue' })
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.lte)(db_1.loanSchedules.dueDate, now), (0, drizzle_orm_1.sql) `${db_1.loanSchedules.status} = 'pending'`, (0, drizzle_orm_1.sql) `${db_1.loanSchedules.totalPaid} < ${db_1.loanSchedules.totalDue}`));
}
/**
 * Generate Balance Sheet
 */
async function generateBalanceSheet(asOfDate = new Date()) {
    // Assets
    const cashTransactions = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(case when direction='credit' then amount else -amount end), 0)`
    }).from(db_1.transactions);
    const loansReceivable = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(outstanding_balance), 0)`
    }).from(db_1.loans).where((0, drizzle_orm_1.eq)(db_1.loans.status, 'disbursed'));
    const cash = cashTransactions[0]?.total || 0;
    const loansReceivableAmount = loansReceivable[0]?.total || 0;
    const totalAssets = cash + loansReceivableAmount;
    // Liabilities
    const memberSavings = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(balance), 0)`
    }).from(db_1.savingsAccounts);
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
async function generateIncomeStatement(startDate, endDate) {
    // Interest Income
    const interestIncome = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(interest_amount), 0)`
    }).from(db_1.loans).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${db_1.loans.status} in ('completed', 'disbursed')`, (0, drizzle_orm_1.sql) `${db_1.loans.disbursedAt} >= ${startDate.getTime()}`, (0, drizzle_orm_1.sql) `${db_1.loans.disbursedAt} <= ${endDate.getTime()}`));
    // Membership Fees
    const membershipFees = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(amount), 0)`
    }).from(db_1.transactions).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.transactions.type, 'fee'), (0, drizzle_orm_1.sql) `${db_1.transactions.performedAt} >= ${startDate.getTime()}`, (0, drizzle_orm_1.sql) `${db_1.transactions.performedAt} <= ${endDate.getTime()}`));
    // Operating Expenses
    const operatingExpenses = await db_1.db.select({
        total: (0, drizzle_orm_1.sql) `coalesce(sum(amount), 0)`
    }).from(db_1.expenses).where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(db_1.expenses.status, 'paid'), (0, drizzle_orm_1.sql) `${db_1.expenses.paidAt} >= ${startDate.getTime()}`, (0, drizzle_orm_1.sql) `${db_1.expenses.paidAt} <= ${endDate.getTime()}`));
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
async function generateGeneralLedger(startDate, endDate) {
    let query = db_1.db.select().from(db_1.transactions);
    if (startDate && endDate) {
        query = query.where((0, drizzle_orm_1.and)((0, drizzle_orm_1.sql) `${db_1.transactions.performedAt} >= ${startDate.getTime()}`, (0, drizzle_orm_1.sql) `${db_1.transactions.performedAt} <= ${endDate.getTime()}`));
    }
    const ledgerEntries = await query;
    return ledgerEntries.sort((a, b) => new Date(b.performedAt ?? 0).getTime() - new Date(a.performedAt ?? 0).getTime());
}
