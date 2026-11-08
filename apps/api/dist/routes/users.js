"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("@sharvic/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticate, (0, auth_1.authorize)('admin', 'chairperson'), async (req, res) => {
    const all = await db_1.db.query.users.findMany();
    res.json(all);
});
exports.default = router;
