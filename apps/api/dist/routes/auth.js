"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'sharvic-dev-secret-change-in-prod';
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;
        if (!password || (!email && !phone)) {
            return res.status(400).json({ error: 'Email/phone and password required' });
        }
        let user;
        if (email) {
            user = await db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.users.email, email) });
        }
        else if (phone) {
            user = await db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.users.phone, phone) });
        }
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid credentials' });
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
        await db_1.db.update(db_1.users).set({ lastLoginAt: new Date() }).where((0, drizzle_orm_1.eq)(db_1.users.id, user.id));
        // Resolve the member profile linked to this login (used by the mobile app)
        let member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.userId, user.id) });
        if (!member && user.role === 'member' && user.phone) {
            member = await db_1.db.query.members.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.members.phone, user.phone) });
            if (member) {
                await db_1.db.update(db_1.members).set({ userId: user.id }).where((0, drizzle_orm_1.eq)(db_1.members.id, member.id));
            }
        }
        res.json({
            token,
            user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email, phone: user.phone },
            memberId: member?.id ?? null,
            member: member ?? null,
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Login failed' });
    }
});
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;
        if (!fullName || !password || (!email && !phone)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existing = email ? await db_1.db.query.users.findFirst({ where: (0, drizzle_orm_1.eq)(db_1.users.email, email) }) : null;
        if (existing)
            return res.status(400).json({ error: 'User already exists' });
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const [user] = await db_1.db.insert(db_1.users).values({
            fullName,
            email: email || null,
            phone: phone || null,
            passwordHash,
            role: role || 'member',
        }).returning();
        res.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Registration failed' });
    }
});
exports.default = router;
