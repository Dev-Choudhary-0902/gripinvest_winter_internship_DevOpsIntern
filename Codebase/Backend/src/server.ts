import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pino from 'pino';
import pinoHttp from 'pino-http';
import pool from './database';
import { authRouter } from './tabs/auth';
import { productsRouter } from './tabs/products';
import { investmentsRouter } from './tabs/investments';
import { logsRouter } from './tabs/logs';
import { transactionLogger } from './middleware/transactionLogger';

const app = express();
const logger = pino({ level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

app.use(cors());
app.use(express.json());
app.use(pinoHttp({ logger }));
app.use(transactionLogger);

// Disable ETags globally to prevent caching issues
app.disable('etag');

// health
app.get('/health', async (_req: Request, res: Response) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(500).json({ status: 'error', db: 'down' });
  }
});

// routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/logs', logsRouter);

// error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  logger.info({ port }, 'Backend listening');
});


