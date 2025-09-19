import { Router, Request, Response } from 'express';
import { executeQuery } from '../database';
import { requireAuth } from './auth';

export const logsRouter = Router();

logsRouter.get('/user/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const rows = await executeQuery(
    'SELECT * FROM transaction_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
    [userId]
  ) as any[];
  const logs = rows.map((r) => ({
    id: Number(r.id),
    userId: r.user_id,
    email: r.email,
    endpoint: r.endpoint,
    httpMethod: r.http_method,
    statusCode: Number(r.status_code),
    errorMessage: r.error_message,
    createdAt: r.created_at,
  }));
  res.json(logs);
});

logsRouter.get('/user/me', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const rows = await executeQuery(
    'SELECT * FROM transaction_logs WHERE user_id = ? AND endpoint != "/api/logs/user/me" ORDER BY created_at DESC LIMIT 500',
    [userId]
  ) as any[];
  
  // Disable all caching mechanisms and add timestamp to make response unique
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': '',
    'Last-Modified': '',
    'X-Timestamp': Date.now().toString()
  });
  
  const logs = rows.map((r) => ({
    id: Number(r.id),
    userId: r.user_id,
    email: r.email,
    endpoint: r.endpoint,
    httpMethod: r.http_method,
    statusCode: Number(r.status_code),
    errorMessage: r.error_message,
    createdAt: r.created_at,
  }));
  res.json(logs);
});

logsRouter.get('/summary/:userId', requireAuth, async (req: Request, res: Response) => {
  const userId = String(req.params.userId);
  const rows = await executeQuery(
    'SELECT * FROM transaction_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 500',
    [userId]
  ) as any[];
  const errors = rows.filter((l: any) => Number(l.status_code) >= 400);
  const summary = `You had ${errors.length} error(s). Most common status: ${mode(errors.map((e: any) => Number(e.status_code))) ?? 'n/a'}.`;
  res.json({ summary });
});

function mode(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let max = -1, val = nums[0];
  for (const [k, v] of counts) if (v > max) { max = v; val = k; }
  return val;
}


