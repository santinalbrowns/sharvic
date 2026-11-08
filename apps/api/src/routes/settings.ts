import { Router } from 'express';
import { db, settings } from '@sharvic/db';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const all = await db.query.settings.findMany();
  res.json(all);
});

router.post('/', authenticate, authorize('admin', 'chairperson'), async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const [setting] = await db.insert(settings).values({ key, value, description }).returning();
    res.json(setting);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save setting' });
  }
});

router.put('/:key', authenticate, authorize('admin', 'chairperson'), async (req, res) => {
  try {
    const key = String(req.params.key);
    const [setting] = await db.update(settings).set({ value: req.body.value, updatedAt: new Date() }).where(eq(settings.key, key)).returning();
    res.json(setting);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

export default router;
