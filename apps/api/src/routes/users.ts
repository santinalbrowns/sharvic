import { Router } from 'express';
import { db, users } from '@sharvic/db';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, authorize('admin', 'chairperson'), async (req, res) => {
  const all = await db.query.users.findMany();
  res.json(all);
});

export default router;
