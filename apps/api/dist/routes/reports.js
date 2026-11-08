"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const financial_1 = require("../utils/financial");
const router = (0, express_1.Router)();
router.get('/summary', auth_1.authenticate, async (req, res) => {
    try {
        const totalMembers = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(db_1.members);
        const activeMembers = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(db_1.members).where((0, drizzle_orm_1.sql) `status = 'active'`);
        const totalLoans = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(db_1.loans);
        const pendingLoans = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(db_1.loans).where((0, drizzle_orm_1.sql) `status = 'pending'`);
        const disbursedLoans = await db_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(db_1.loans).where((0, drizzle_orm_1.sql) `status = 'disbursed'`);
        const totalContributions = await db_1.db.select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(amount),0)` }).from(db_1.contributions);
        const totalLoanAmount = await db_1.db.select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(principal_amount),0)` }).from(db_1.loans).where((0, drizzle_orm_1.sql) `status in ('disbursed','completed')`);
        const totalOutstanding = await db_1.db.select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(outstanding_balance),0)` }).from(db_1.loans).where((0, drizzle_orm_1.sql) `status = 'disbursed'`);
        const totalRepayments = await db_1.db.select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(amount),0)` }).from(db_1.loanRepayments);
        const totalExpenses = await db_1.db.select({ sum: (0, drizzle_orm_1.sql) `coalesce(sum(amount),0)` }).from(db_1.expenses).where((0, drizzle_orm_1.sql) `status = 'paid'`);
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
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});
router.get('/loan-performance', auth_1.authenticate, async (req, res) => {
    const allLoans = await db_1.db.query.loans.findMany();
    res.json(allLoans);
});
router.get('/member-statements', auth_1.authenticate, async (req, res) => {
    const allMembers = await db_1.db.query.members.findMany();
    res.json(allMembers);
});
// NEW: Balance Sheet
router.get('/balance-sheet', auth_1.authenticate, async (req, res) => {
    try {
        const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate) : new Date();
        const balanceSheet = await (0, financial_1.generateBalanceSheet)(asOfDate);
        res.json({
            asOfDate,
            ...balanceSheet,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate balance sheet' });
    }
});
// NEW: Income Statement
router.get('/income-statement', auth_1.authenticate, async (req, res) => {
    try {
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate.getFullYear(), 0, 1);
        const incomeStatement = await (0, financial_1.generateIncomeStatement)(startDate, endDate);
        res.json({
            period: { startDate, endDate },
            ...incomeStatement,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate income statement' });
    }
});
// NEW: General Ledger
router.get('/general-ledger', auth_1.authenticate, async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
        const ledger = await (0, financial_1.generateGeneralLedger)(startDate, endDate);
        res.json({
            period: { startDate, endDate },
            transactions: ledger,
            totalCount: ledger.length,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate general ledger' });
    }
});
// NEW: Cash Flow Statement
router.get('/cash-flow', auth_1.authenticate, async (req, res) => {
    try {
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(endDate.getFullYear(), 0, 1);
        const ledger = await (0, financial_1.generateGeneralLedger)(startDate, endDate);
        // Categorize cash flows
        const operatingActivities = ledger.filter(t => ['contribution', 'loan_repayment', 'expense'].includes(t.type));
        const financingActivities = ledger.filter(t => ['loan_disbursement', 'fee'].includes(t.type));
        const operatingCashFlow = operatingActivities.reduce((sum, t) => sum + (t.direction === 'credit' ? t.amount : -t.amount), 0);
        const financingCashFlow = financingActivities.reduce((sum, t) => sum + (t.direction === 'credit' ? t.amount : -t.amount), 0);
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
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to generate cash flow statement' });
    }
});
// NEW: Member Credit Score
router.get('/credit-score/:memberId', auth_1.authenticate, async (req, res) => {
    try {
        const breakdown = await (0, financial_1.calculateCreditScoreBreakdown)(String(req.params.memberId));
        res.json({ ...breakdown, creditScore: breakdown.score });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to calculate credit score' });
    }
});
// NEW: Credit scores for every member (used by the scoring overview)
router.get('/credit-scores', auth_1.authenticate, async (req, res) => {
    try {
        const allMembers = await db_1.db.query.members.findMany();
        const scores = await Promise.all(allMembers.map(async (member) => {
            const breakdown = await (0, financial_1.calculateCreditScoreBreakdown)(member.id);
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
        }));
        res.json(scores);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to calculate credit scores' });
    }
});
exports.default = router;
