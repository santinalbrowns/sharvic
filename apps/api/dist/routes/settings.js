"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@sharvic/db");
const drizzle_orm_1 = require("drizzle-orm");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, async (req, res) => {
    const all = await db_1.db.query.settings.findMany();
    res.json(all);
});
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson'), async (req, res) => {
    try {
        const { key, value, description } = req.body;
        const [setting] = await db_1.db.insert(db_1.settings).values({ key, value, description }).returning();
        res.json(setting);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to save setting' });
    }
});
router.put('/:key', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson'), async (req, res) => {
    try {
        const key = String(req.params.key);
        const [setting] = await db_1.db.update(db_1.settings).set({ value: req.body.value, updatedAt: new Date() }).where((0, drizzle_orm_1.eq)(db_1.settings.key, key)).returning();
        res.json(setting);
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to update setting' });
    }
});
exports.default = router;
