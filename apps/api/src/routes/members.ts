import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, members, users, savingsAccounts } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';
import { nanoid } from 'nanoid';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const all = await db.query.members.findMany({ with: {} });
  res.json(all);
});

router.post('/', authenticate, authorize('admin', 'chairperson', 'secretary', 'treasurer'), async (req, res) => {
  try {
    const { firstName, lastName, phone, nationalId, address, memberType, gender, email, password } = req.body;
    const memberNo = `SVB-${Date.now().toString().slice(-6)}`;
    const accountNo = `ACC-${nanoid(10).toUpperCase()}`;

    // Optionally create a login account so the member can use the mobile app
    let userId: string | null = null;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({
        fullName: `${firstName} ${lastName}`.trim(),
        email: email || null,
        phone: phone || null,
        passwordHash,
        role: 'member',
      }).returning();
      userId = user.id;
    }

    const [member] = await db.insert(members).values({
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
    await db.insert(savingsAccounts).values({
      memberId: member.id,
      accountNo,
      balance: 0,
    });
    res.json(member);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  const member = await db.query.members.findFirst({ where: eq(members.id, String(req.params.id)) });
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

router.put('/:id', authenticate, authorize('admin', 'chairperson', 'secretary'), async (req, res) => {
  try {
    const [member] = await db.update(members).set({ ...req.body, updatedAt: new Date() }).where(eq(members.id, String(req.params.id))).returning();
    res.json(member);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update member' });
  }
});

router.post('/:id/pay-membership-fee', authenticate, authorize('admin', 'chairperson', 'treasurer'), async (req, res) => {
  try {
    const [member] = await db.update(members).set({
      membershipFeePaid: true,
      membershipFeePaidAt: new Date(),
    }).where(eq(members.id, String(req.params.id))).returning();
    res.json(member);
  } catch (e) {
    res.status(500).json({ error: 'Failed to record membership fee' });
  }
});

// Create a mobile login for an existing member
router.post('/:id/create-account', authenticate, authorize('admin', 'chairperson', 'secretary'), async (req, res) => {
  try {
    const memberId = String(req.params.id);
    const { email, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const member = await db.query.members.findFirst({ where: eq(members.id, memberId) });
    if (!member) return res.status(404).json({ error: 'Member not found' });
    if (member.userId) return res.status(400).json({ error: 'Member already has a login account' });

    if (email) {
      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      fullName: `${member.firstName} ${member.lastName}`.trim(),
      email: email || null,
      phone: member.phone,
      passwordHash,
      role: 'member',
    }).returning();
    await db.update(members).set({ userId: user.id }).where(eq(members.id, member.id));

    res.json({ memberId: member.id, userId: user.id, email: user.email, phone: user.phone });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create member login' });
  }
});

export default router;
