import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth';
import { executeQuery } from '../database';
import crypto from 'node:crypto';

export const productsRouter = Router();

const productSchema = z.object({
  name: z.string().min(1),
  investmentType: z.enum(['bond','fd','mf','etf','other']),
  tenureMonths: z.number().int().min(0),
  annualYield: z.number().positive(),
  riskLevel: z.enum(['low','moderate','high']),
  minInvestment: z.number().positive().optional(),
  maxInvestment: z.number().positive().optional(),
  description: z.string().optional(),
});

function aiGenerateDescription(input: { name: string; investmentType: string; riskLevel: string }): string {
  const riskDescriptions = {
    low: 'conservative investment with stable returns and minimal volatility',
    moderate: 'balanced investment offering moderate risk with steady growth potential',
    high: 'aggressive investment with higher volatility but significant growth opportunities'
  };
  
  const typeDescriptions = {
    bond: 'government or corporate bonds providing fixed income',
    fd: 'fixed deposit offering guaranteed returns with capital protection',
    mf: 'mutual fund providing diversified exposure across asset classes',
    etf: 'exchange-traded fund tracking market indices with low costs',
    other: 'alternative investment vehicle with unique risk-return profile'
  };
  
  const riskDesc = riskDescriptions[input.riskLevel as keyof typeof riskDescriptions] || 'moderate risk';
  const typeDesc = typeDescriptions[input.investmentType as keyof typeof typeDescriptions] || 'investment product';
  
  return `${input.name} is a ${typeDesc} designed as a ${riskDesc}. This investment opportunity is suitable for investors seeking ${input.riskLevel === 'low' ? 'capital preservation' : input.riskLevel === 'high' ? 'aggressive growth' : 'balanced returns'} and can be an excellent addition to a well-diversified portfolio. The product offers professional management and follows industry best practices for risk management.`;
}

function mapProductRow(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    investmentType: row.investment_type,
    tenureMonths: Number(row.tenure_months),
    annualYield: Number(row.annual_yield),
    riskLevel: row.risk_level,
    minInvestment: row.min_investment != null ? Number(row.min_investment) : null,
    maxInvestment: row.max_investment != null ? Number(row.max_investment) : null,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Admin create
productsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { name, investmentType, tenureMonths, annualYield, riskLevel, minInvestment, maxInvestment, description } = parsed.data;
  const desc = description ?? aiGenerateDescription({ name, investmentType, riskLevel });
  const id = crypto.randomUUID();
  await executeQuery(
    `INSERT INTO investment_products (id, name, investment_type, tenure_months, annual_yield, risk_level, min_investment, max_investment, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, investmentType, tenureMonths, annualYield, riskLevel, minInvestment ?? 500, maxInvestment ?? null, desc]
  );
  const rows = await executeQuery('SELECT * FROM investment_products WHERE id = ?', [id]) as any[];
  res.status(201).json(mapProductRow(rows[0]));
});

// Admin update
productsRouter.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const fields = parsed.data as any;
  const sets: string[] = [];
  const vals: any[] = [];
  const mapping: Record<string, string> = {
    name: 'name',
    investmentType: 'investment_type',
    tenureMonths: 'tenure_months',
    annualYield: 'annual_yield',
    riskLevel: 'risk_level',
    minInvestment: 'min_investment',
    maxInvestment: 'max_investment',
    description: 'description',
  };
  for (const key of Object.keys(fields)) {
    sets.push(`${mapping[key]} = ?`);
    vals.push((fields as any)[key]);
  }
  if (sets.length === 0) return res.json({});
  await executeQuery(`UPDATE investment_products SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
  const rows = await executeQuery('SELECT * FROM investment_products WHERE id = ?', [id]) as any[];
  res.json(mapProductRow(rows[0]));
});

// Admin delete
productsRouter.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const id = String(req.params.id);
  await executeQuery('DELETE FROM investment_products WHERE id = ?', [id]);
  res.status(204).send();
});

// List
productsRouter.get('/', async (_req: Request, res: Response) => {
  const products = await executeQuery('SELECT * FROM investment_products ORDER BY created_at DESC') as any[];
  res.json(products.map(mapProductRow));
});

// Get by id
productsRouter.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const rows = await executeQuery('SELECT * FROM investment_products WHERE id = ?', [id]) as any[];
  const product = mapProductRow(rows[0]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// AI recommendations
productsRouter.get('/recommendations', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const users = await executeQuery('SELECT risk_appetite FROM users WHERE id = ?', [userId]) as any[];
  if (users.length === 0) return res.status(404).json({ error: 'User not found' });
  const user = users[0];
  const map: Record<string, string[]> = {
    low: ['low'],
    moderate: ['low', 'moderate'],
    high: ['moderate', 'high'],
  };
  const risks = map[user.risk_appetite] ?? ['low', 'moderate'];
  const placeholders = risks.map(() => '?').join(',');
  const products = await executeQuery(
    `SELECT * FROM investment_products WHERE risk_level IN (${placeholders}) LIMIT 10`,
    risks
  ) as any[];
  res.json({ products: products.map(mapProductRow), rationale: `Based on your ${user.risk_appetite} risk appetite` });
});


