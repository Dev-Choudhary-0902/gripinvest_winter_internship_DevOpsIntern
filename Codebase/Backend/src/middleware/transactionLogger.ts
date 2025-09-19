import { Request, Response, NextFunction } from 'express';
import { executeQuery } from '../database';

export function transactionLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  res.on('finish', async () => {
    const duration = Date.now() - start;
    // Skip logging requests to the logs endpoint to prevent self-logging spam
    if (req.originalUrl.startsWith('/api/logs/')) {
      return;
    }
    try {
      await executeQuery(
        'INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, error_message) VALUES (?, ?, ?, ?, ?, ?)',
        [
          (req as any).userId ?? null,
          (req as any).userEmail ?? null,
          req.originalUrl,
          req.method,
          res.statusCode,
          res.statusCode >= 400 ? `${req.method} ${req.originalUrl} failed in ${duration}ms` : null
        ]
      );
      if (process.env.NODE_ENV !== 'production') {
        console.log('[txlog] inserted', {
          userId: (req as any).userId ?? null,
          endpoint: req.originalUrl,
          method: req.method,
          status: res.statusCode,
        });
      }
    } catch (err) {
      // avoid crashing on logging failures
      if (process.env.NODE_ENV !== 'production') {
        console.error('[txlog] insert failed', err);
      }
    }
  });
  next();
}


