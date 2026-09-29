import express from 'express';
import cors from 'cors';
import { CLIENT_ORIGINS } from './config.js';
import { pool } from './db.js';
import { asyncHandler, errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import applicationRoutes from './routes/applications.js';
import dashboardRoutes from './routes/dashboard.js';

// Kept separate from index.js so tests can import the app without opening a port.
export const app = express();

app.use(cors({ origin: CLIENT_ORIGINS.length ? CLIENT_ORIGINS : true }));
app.use(express.json({ limit: '100kb' }));

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFound);
app.use(errorHandler);
