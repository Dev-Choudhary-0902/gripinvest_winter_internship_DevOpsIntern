import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from './auth';
import { executeQuery } from '../database';
import crypto from 'node:crypto';

export const investmentsRouter = Router();

const investSchema = z.object({ productId: z.string().uuid(), amount: z.number().positive() });

investmentsRouter.post('/', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const parsed = investSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { productId, amount } = parsed.data;
  const users = await executeQuery('SELECT id FROM users WHERE id = ?', [userId]) as any[];
  const products = await executeQuery('SELECT id, annual_yield FROM investment_products WHERE id = ?', [productId]) as any[];
  if (users.length === 0 || products.length === 0) return res.status(404).json({ error: 'User or product not found' });
  const product = products[0];
  const expectedReturn = amount + amount * Number(product.annual_yield) / 100;
  const id = crypto.randomUUID();
  await executeQuery(
    'INSERT INTO investments (id, user_id, product_id, amount, expected_return) VALUES (?, ?, ?, ?, ?)',
    [id, userId, productId, amount, expectedReturn]
  );
  // Ensure a user-scoped transaction record exists even if middleware logging is skipped by proxies
  try {
    await executeQuery(
      'INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, error_message) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, (req as any).userEmail ?? null, '/api/investments', 'POST', 201, null]
    );
  } catch {}
  res.status(201).json({ message: 'Investment successful', amount, expectedReturn });
});

investmentsRouter.get('/portfolio', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId as string;
  const investments = await executeQuery(
    `SELECT i.*, p.name as product_name, p.risk_level as product_risk_level, p.annual_yield as product_annual_yield
     FROM investments i JOIN investment_products p ON p.id = i.product_id
     WHERE i.user_id = ? ORDER BY i.invested_at DESC`,
    [userId]
  ) as any[];
  const mapped = (investments as any[]).map((row) => ({
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    amount: Number(row.amount),
    investedAt: row.invested_at,
    status: row.status,
    expectedReturn: row.expected_return != null ? Number(row.expected_return) : null,
    maturityDate: row.maturity_date,
    product: {
      id: row.product_id,
      name: row.product_name,
      riskLevel: row.product_risk_level,
      annualYield: Number(row.product_annual_yield),
    },
  }));
  const total = mapped.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const byRisk: Record<string, number> = {};
  for (const inv of mapped) {
    const risk = inv.product.riskLevel as string;
    byRisk[risk] = (byRisk[risk] || 0) + Number(inv.amount);
  }
  // Enhanced AI portfolio analysis
  const riskDistribution = Object.entries(byRisk).reduce((acc, [risk, amount]) => {
    acc[risk] = { amount, percentage: (amount / total) * 100 };
    return acc;
  }, {} as Record<string, { amount: number; percentage: number }>);
  
  const riskAnalysis = Object.entries(riskDistribution).map(([risk, data]) => {
    const riskAdvice = {
      low: 'provides stability and capital preservation',
      moderate: 'offers balanced growth with manageable risk',
      high: 'seeks aggressive growth but requires careful monitoring'
    };
    return `${data.percentage.toFixed(1)}% in ${risk}-risk investments (${riskAdvice[risk as keyof typeof riskAdvice]})`;
  }).join(', ');
  
  const diversificationScore = Object.keys(byRisk).length;
  const diversificationAdvice = diversificationScore >= 2 
    ? 'Good diversification across risk levels' 
    : 'Consider diversifying across different risk levels for better portfolio balance';
  
  const totalReturn = mapped.reduce((sum, inv) => sum + (Number(inv.expectedReturn) - Number(inv.amount)), 0);
  const avgReturn = mapped.length > 0 ? (totalReturn / mapped.length) : 0;
  
  const advice = `Portfolio Analysis: Your total investment of ₹${total.toLocaleString()} is distributed as ${riskAnalysis}. ${diversificationAdvice}. Expected average return: ₹${avgReturn.toLocaleString()}. Consider rebalancing quarterly and maintaining an emergency fund equivalent to 3-6 months of expenses.`;
  
  res.json({ 
    total, 
    count: mapped.length, 
    breakdown: byRisk, 
    riskDistribution,
    diversificationScore,
    expectedTotalReturn: totalReturn,
    investments: mapped, 
    ai_summary: advice 
  });
});


