import { Router } from 'express';
import { pool } from '../db.js';
import { asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const uid = req.user.id;
    const [counts, upcoming, recent] = await Promise.all([
      pool.query(
        'SELECT status, COUNT(*)::int AS count FROM applications WHERE user_id = $1 GROUP BY status',
        [uid]
      ),
      pool.query(
        `SELECT id, company, role, status, interview_date FROM applications
         WHERE user_id = $1 AND interview_date >= now()
         ORDER BY interview_date ASC LIMIT 5`,
        [uid]
      ),
      pool.query(
        `SELECT id, company, role, status, updated_at FROM applications
         WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 5`,
        [uid]
      ),
    ]);

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    for (const r of counts.rows) byStatus[r.status] = r.count;
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    res.json({ total, byStatus, upcomingInterviews: upcoming.rows, recent: recent.rows });
  })
);

export default router;
