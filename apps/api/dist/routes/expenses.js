"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    const all = await db_1.db.query.expenses.findMany();
    res.json(all);
});
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { description, category, amount, paidTo, paymentMethod, notes } = req.body;
        const expenseNo = `EXP-${Date.now().toString().slice(-8)}`;
        const [expense] = await db_1.db.insert(db_1.expenses).values({
            expenseNo,
            description,
            category,
            amount,
            paidTo,
            paymentMethod: paymentMethod || 'cash',
            requestedBy: req.user.id,
            notes,
        }).returning();
        res.json(expense);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to create expense' });
    }
});
router.post('/:id/approve', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'treasurer'), async (req, res) => {
    try {
        const [expense] = await db_1.db.update(db_1.expenses).set({
            status: 'approved',
            approvedBy: req.user.id,
            approvedAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(db_1.expenses.id, req.params.id)).returning();
        res.json(expense);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to approve expense' });
    }
});
exports.default = router;
