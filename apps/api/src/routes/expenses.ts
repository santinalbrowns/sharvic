import { Router } from 'express';
import { db, expenses } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const all = await db.query.expenses.findMany();
  res.json(all);
});

router.post('/', authenticate, async (req: any, res) => {
  try {
    const { description, category, amount, paidTo, paymentMethod, notes } = req.body;
    const expenseNo = `EXP-${Date.now().toString().slice(-8)}`;
    const [expense] = await db.insert(expenses).values({
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
  } catch (e) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.post('/:id/approve', authenticate, authorize('admin', 'chairperson', 'treasurer'), async (req: any, res) => {
  try {
    const [expense] = await db.update(expenses).set({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    }).where(eq(expenses.id, req.params.id)).returning();
    res.json(expense);
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve expense' });
  }
});

export default router;
