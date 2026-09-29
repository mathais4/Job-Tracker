import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db.js';
import { JWT_SECRET } from '../config.js';
import { HttpError, asyncHandler } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const registerSchema = z.object({
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});
const loginSchema = z.object({ email, password: z.string().min(1, 'Password is required') });

const sign = (userId) => jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: '7d' });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
        [email, hash]
      );
      res.status(201).json({ token: sign(rows[0].id), user: rows[0] });
    } catch (err) {
      if (err.code === '23505') throw new HttpError(409, 'Email is already registered');
      throw err;
    }
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { rows } = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];
    // Same message for unknown email and wrong password: don't leak which emails exist.
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) throw new HttpError(401, 'Invalid email or password');
    res.json({ token: sign(user.id), user: { id: user.id, email: user.email } });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) throw new HttpError(401, 'User no longer exists');
    res.json({ user: rows[0] });
  })
);

export default router;
