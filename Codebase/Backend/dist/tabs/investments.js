"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.investmentsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const database_1 = require("../database");
const node_crypto_1 = __importDefault(require("node:crypto"));
exports.investmentsRouter = (0, express_1.Router)();
const investSchema = zod_1.z.object({ productId: zod_1.z.string().uuid(), amount: zod_1.z.number().positive() });
exports.investmentsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const parsed = investSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { productId, amount } = parsed.data;
    const users = await (0, database_1.executeQuery)('SELECT id FROM users WHERE id = ?', [userId]);
    const products = await (0, database_1.executeQuery)('SELECT id, annual_yield FROM investment_products WHERE id = ?', [productId]);
    if (users.length === 0 || products.length === 0)
        return res.status(404).json({ error: 'User or product not found' });
    const product = products[0];
    const expectedReturn = amount + amount * Number(product.annual_yield) / 100;
    const id = node_crypto_1.default.randomUUID();
    await (0, database_1.executeQuery)('INSERT INTO investments (id, user_id, product_id, amount, expected_return) VALUES (?, ?, ?, ?, ?)', [id, userId, productId, amount, expectedReturn]);
    // Ensure a user-scoped transaction record exists even if middleware logging is skipped by proxies
    try {
        await (0, database_1.executeQuery)('INSERT INTO transaction_logs (user_id, email, endpoint, http_method, status_code, error_message) VALUES (?, ?, ?, ?, ?, ?)', [userId, req.userEmail ?? null, '/api/investments', 'POST', 201, null]);
    }
    catch { }
    res.status(201).json({ message: 'Investment successful', amount, expectedReturn });
});
exports.investmentsRouter.get('/portfolio', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const investments = await (0, database_1.executeQuery)(`SELECT i.*, p.name as product_name, p.risk_level as product_risk_level, p.annual_yield as product_annual_yield
     FROM investments i JOIN investment_products p ON p.id = i.product_id
     WHERE i.user_id = ? ORDER BY i.invested_at DESC`, [userId]);
    const mapped = investments.map((row) => ({
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
    const byRisk = {};
    for (const inv of mapped) {
        const risk = inv.product.riskLevel;
        byRisk[risk] = (byRisk[risk] || 0) + Number(inv.amount);
    }
    // Enhanced AI portfolio analysis
    const riskDistribution = Object.entries(byRisk).reduce((acc, [risk, amount]) => {
        acc[risk] = { amount, percentage: (amount / total) * 100 };
        return acc;
    }, {});
    const riskAnalysis = Object.entries(riskDistribution).map(([risk, data]) => {
        const riskAdvice = {
            low: 'provides stability and capital preservation',
            moderate: 'offers balanced growth with manageable risk',
            high: 'seeks aggressive growth but requires careful monitoring'
        };
        return `${data.percentage.toFixed(1)}% in ${risk}-risk investments (${riskAdvice[risk]})`;
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
