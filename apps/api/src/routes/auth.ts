import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, users, members } from '@sharvic/db';
import { eq } from 'drizzle-orm';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sharvic-dev-secret-change-in-prod';

router.post('/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!password || (!email && !phone)) {
      return res.status(400).json({ error: 'Email/phone and password required' });
    }
    let user;
    if (email) {
      user = await db.query.users.findFirst({ where: eq(users.email, email) });
    } else if (phone) {
      user = await db.query.users.findFirst({ where: eq(users.phone, phone) });
    }
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

    // Resolve the member profile linked to this login (used by the mobile app)
    let member = await db.query.members.findFirst({ where: eq(members.userId, user.id) });
    if (!member && user.role === 'member' && user.phone) {
      member = await db.query.members.findFirst({ where: eq(members.phone, user.phone) });
      if (member) {
        await db.update(members).set({ userId: user.id }).where(eq(members.id, member.id));
      }
    }

    res.json({
      token,
      user: { id: user.id, fullName: user.fullName, role: user.role, email: user.email, phone: user.phone },
      memberId: member?.id ?? null,
      member: member ?? null,
    });
  } catch (e) {
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
    const existing = email ? await db.query.users.findFirst({ where: eq(users.email, email) }) : null;
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      fullName,
      email: email || null,
      phone: phone || null,
      passwordHash,
      role: role || 'member',
    }).returning();
    res.json({ user: { id: user.id, fullName: user.fullName, role: user.role } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

export default router;
