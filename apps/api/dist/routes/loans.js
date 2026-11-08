"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const financial_1 = require("../utils/financial");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    const memberId = req.query.memberId ? String(req.query.memberId) : null;
    const all = memberId
        ? await db_1.db.query.loans.findMany({ where: (0, drizzle_orm_1.eq)(db_1.loans.memberId, memberId) })
        : await db_1.db.query.loans.findMany();
    res.json(all);
});
// NEW: Check loan eligibility before applying
router.post('/check-eligibility', auth_1.authenticate, async (req, res) => {
    try {
        const { memberId, requestedAmount } = req.body;
        const eligibility = await (0, financial_1.checkLoanEligibility)(memberId, requestedAmount);
        res.json(eligibility);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to check eligibility' });
    }
});
router.post('/apply', auth_1.authenticate, async (req, res) => {
    try {
        const { memberId, principalAmount, termMonths, purpose, guarantors } = req.body;
        // Check eligibility first
        const eligibility = await (0, financial_1.checkLoanEligibility)(memberId, principalAmount);
        if (!eligibility.eligible) {
            return res.status(400).json({
                error: 'Not eligible for loan',
                reasons: eligibility.reasons,
                creditScore: eligibility.creditScore,
            });
        }
        const member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.id, memberId) });
        if (!member)
            return res.status(404).json({ error: 'Member not found' });
        const interestRate = member.memberType === 'member' ? 10 : 20;
        const interestAmount = (principalAmount * interestRate) / 100;
        const totalRepayable = principalAmount + interestAmount;
        const loanNo = `LN-${Date.now().toString().slice(-8)}`;
        const [loan] = await db_1.db.insert(db_1.loans).values({
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
                await db_1.db.insert(db_1.loanGuarantors).values({
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
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to apply for loan' });
    }
});
router.post('/:id/approve', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'loan_officer'), async (req, res) => {
    try {
        const [loan] = await db_1.db.update(db_1.loans).set({
            status: 'approved',
            approvedBy: req.user.id,
            approvedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(db_1.loans.id, String(req.params.id))).returning();
        res.json(loan);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to approve loan' });
    }
});
router.post('/:id/disburse', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'treasurer'), async (req, res) => {
    try {
        const [loan] = await db_1.db.update(db_1.loans).set({
            status: 'disbursed',
            disbursedBy: req.user.id,
            disbursedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(db_1.loans.id, String(req.params.id))).returning();
        // Generate repayment schedule
        await (0, financial_1.generateLoanSchedule)(loan.id);
        res.json(loan);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to disburse loan' });
    }
});
router.post('/:id/reject', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'loan_officer'), async (req, res) => {
    try {
        const { reason } = req.body;
        const [loan] = await db_1.db.update(db_1.loans).set({
            status: 'rejected',
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            rejectionReason: reason || 'Not specified',
        }).where((0, drizzle_orm_1.eq)(db_1.loans.id, String(req.params.id))).returning();
        res.json(loan);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to reject loan' });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const loan = await db_1.db.query.loans.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.loans.id, String(req.params.id)) });
    if (!loan)
        return res.status(404).json({ error: 'Loan not found' });
    const guarantors = await db_1.db.query.loanGuarantors.findMany({ where: (0, drizzle_orm_1.eq)(db_1.loanGuarantors.loanId, loan.id) });
    const repayments = await db_1.db.query.loanRepayments.findMany({ where: (0, drizzle_orm_1.eq)(db_1.loanRepayments.loanId, loan.id) });
    const schedule = await db_1.db.query.loanSchedules?.findMany({ where: (0, drizzle_orm_1.eq)(db_1.loanSchedules.loanId, loan.id) }) || [];
    const loanPenalties = await db_1.db.query.penalties?.findMany({ where: (0, drizzle_orm_1.eq)(db_1.penalties.loanId, loan.id) }) || [];
    res.json({ ...loan, guarantors, repayments, schedule, penalties: loanPenalties });
});
router.post('/:id/repay', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'treasurer', 'loan_officer'), async (req, res) => {
    try {
        const { amount, paymentMethod, notes } = req.body;
        const loan = await db_1.db.query.loans.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.loans.id, String(req.params.id)) });
        if (!loan)
            return res.status(404).json({ error: 'Loan not found' });
        if (loan.status !== 'disbursed')
            return res.status(400).json({ error: 'Loan not disbursed' });
        const receiptNo = `PAY-${Date.now().toString().slice(-10)}`;
        const [repayment] = await db_1.db.insert(db_1.loanRepayments).values({
            loanId: loan.id,
            amount: parseFloat(amount),
            receiptNo,
            paymentMethod: paymentMethod || 'cash',
            notes,
            receivedBy: req.user.id,
        }).returning();
        // Allocate repayment to schedule
        await (0, financial_1.allocateRepayment)(loan.id, parseFloat(amount));
        const newBalance = Math.max(0, loan.outstandingBalance - parseFloat(amount));
        await db_1.db.update(db_1.loans).set({
            outstandingBalance: newBalance,
            status: newBalance === 0 ? 'completed' : loan.status,
        }).where((0, drizzle_orm_1.eq)(db_1.loans.id, loan.id));
        res.json(repayment);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to record repayment' });
    }
});
// NEW: Calculate and apply penalties
router.post('/:id/calculate-penalties', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'loan_officer'), async (req, res) => {
    try {
        const penaltyAmount = await (0, financial_1.calculatePenalties)(String(req.params.id));
        if (penaltyAmount > 0) {
            const [penalty] = await db_1.db.insert(db_1.penalties).values({
                loanId: String(req.params.id),
                amount: penaltyAmount,
                reason: 'Late payment penalty',
                status: 'pending',
                appliedBy: req.user.id,
            }).returning();
            res.json({ penalty, message: 'Penalty applied successfully' });
        }
        else {
            res.json({ penalty: null, message: 'No penalties to apply' });
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to calculate penalties' });
    }
});
// NEW: Mark overdue schedules (can be run as a cron job)
router.post('/system/mark-overdue', auth_1.authenticate, (0, auth_1.authorize)('admin'), async (req, res) => {
    try {
        await (0, financial_1.markOverdueSchedules)();
        res.json({ message: 'Overdue schedules marked successfully' });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to mark overdue schedules' });
    }
});
exports.default = router;
