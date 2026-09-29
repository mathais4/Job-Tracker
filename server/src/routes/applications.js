import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db.js';
import { HttpError, asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const STATUSES = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
const status = z.enum(STATUSES);

const base = z.object({
  company: z.string().trim().min(1, 'Company is required').max(200),
  role: z.string().trim().min(1, 'Role is required').max(200),
  status,
  interview_date: z.string().datetime({ offset: true }).nullable(),
  notes: z.string().max(5000).nullable(),
});
const createSchema = base.partial({ interview_date: true, notes: true }).extend({
  status: status.default('applied'),
});
const updateSchema = base
  .partial()
  .refine((o) => Object.keys(o).length > 0, { message: 'Provide at least one field to update' });

const listSchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: status.optional(),
  sort: z.enum(['created_at', 'updated_at', 'company', 'interview_date']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const idSchema = z.coerce.number().int().positive();

// SECURITY: every query below filters by user_id so users only ever see their own rows.

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, status, sort, order, page, limit } = listSchema.parse(req.query);

    const where = ['user_id = $1'];
    const params = [req.user.id];
    if (status) {
      params.push(status);
      where.push(`status = $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      const p = `$${params.length}`;
      where.push(`(company ILIKE ${p} OR role ILIKE ${p} OR notes ILIKE ${p})`);
    }
    const whereSql = where.join(' AND ');

    const total = (
      await pool.query(`SELECT COUNT(*)::int AS n FROM applications WHERE ${whereSql}`, params)
    ).rows[0].n;

    // sort/order come from zod enums, so interpolating them is safe.
    const nulls = sort === 'interview_date' ? ' NULLS LAST' : '';
    const { rows } = await pool.query(
      `SELECT * FROM applications WHERE ${whereSql}
       ORDER BY ${sort} ${order}${nulls}, id DESC
       LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    );

    res.json({ data: rows, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const d = createSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO applications (user_id, company, role, status, interview_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, d.company, d.role, d.status, d.interview_date ?? null, d.notes ?? null]
    );
    res.status(201).json(rows[0]);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const { rows } = await pool.query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!rows[0]) throw new HttpError(404, 'Application not found');
    res.json(rows[0]);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const data = updateSchema.parse(req.body);
    const keys = Object.keys(data); // only whitelisted keys survive zod parsing
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE applications SET ${sets}, updated_at = now()
       WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
      [...keys.map((k) => data[k]), id, req.user.id]
    );
    if (!rows[0]) throw new HttpError(404, 'Application not found');
    res.json(rows[0]);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const { rowCount } = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!rowCount) throw new HttpError(404, 'Application not found');
    res.status(204).end();
  })
);

export default router;
