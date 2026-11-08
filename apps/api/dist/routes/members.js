"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const nanoid_1 = require("nanoid");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    const all = await db_1.db.query.members.findMany({ with: {} });
    res.json(all);
});
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'secretary', 'treasurer'), async (req, res) => {
    try {
        const { firstName, lastName, phone, nationalId, address, memberType, gender, email, password } = req.body;
        const memberNo = `SVB-${Date.now().toString().slice(-6)}`;
        const accountNo = `ACC-${(0, nanoid_1.nanoid)(10).toUpperCase()}`;
        // Optionally create a login account so the member can use the mobile app
        let userId = null;
        if (password) {
            const passwordHash = await bcryptjs_1.default.hash(password, 10);
            const [user] = await db_1.db.insert(db_1.users).values({
                fullName: `${firstName} ${lastName}`.trim(),
                email: email || null,
                phone: phone || null,
                passwordHash,
                role: 'member',
            }).returning();
            userId = user.id;
        }
        const [member] = await db_1.db.insert(db_1.members).values({
            memberNo,
            userId,
            firstName,
            lastName,
            phone,
            nationalId,
            address,
            memberType: memberType || 'member',
            gender,
            membershipFeeAmount: 50000,
        }).returning();
        await db_1.db.insert(db_1.savingsAccounts).values({
            memberId: member.id,
            accountNo,
            balance: 0,
        });
        res.json(member);
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create member' });
    }
});
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.id, String(req.params.id)) });
    if (!member)
        return res.status(404).json({ error: 'Member not found' });
    res.json(member);
});
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'secretary'), async (req, res) => {
    try {
        const [member] = await db_1.db.update(db_1.members).set({ ...req.body, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(db_1.members.id, String(req.params.id))).returning();
        res.json(member);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to update member' });
    }
});
router.post('/:id/pay-membership-fee', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'treasurer'), async (req, res) => {
    try {
        const [member] = await db_1.db.update(db_1.members).set({
            membershipFeePaid: true,
            membershipFeePaidAt: new Date(),
        }).where((0, drizzle_orm_1.eq)(db_1.members.id, String(req.params.id))).returning();
        res.json(member);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to record membership fee' });
    }
});
// Create a mobile login for an existing member
router.post('/:id/create-account', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson', 'secretary'), async (req, res) => {
    try {
        const memberId = String(req.params.id);
        const { email, password } = req.body;
        if (!password)
            return res.status(400).json({ error: 'Password is required' });
        const member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.id, memberId) });
        if (!member)
            return res.status(404).json({ error: 'Member not found' });
        if (member.userId)
            return res.status(400).json({ error: 'Member already has a login account' });
        if (email) {
            const existing = await db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.users.email, email) });
            if (existing)
                return res.status(400).json({ error: 'Email already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const [user] = await db_1.db.insert(db_1.users).values({
            fullName: `${member.firstName} ${member.lastName}`.trim(),
            email: email || null,
            phone: member.phone,
            passwordHash,
            role: 'member',
        }).returning();
        await db_1.db.update(db_1.members).set({ userId: user.id }).where((0, drizzle_orm_1.eq)(db_1.members.id, member.id));
        res.json({ memberId: member.id, userId: user.id, email: user.email, phone: user.phone });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create member login' });
    }
});
exports.default = router;
