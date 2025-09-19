"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("./auth");
const database_1 = require("../database");
const node_crypto_1 = __importDefault(require("node:crypto"));
exports.productsRouter = (0, express_1.Router)();
const productSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    investmentType: zod_1.z.enum(['bond', 'fd', 'mf', 'etf', 'other']),
    tenureMonths: zod_1.z.number().int().min(0),
    annualYield: zod_1.z.number().positive(),
    riskLevel: zod_1.z.enum(['low', 'moderate', 'high']),
    minInvestment: zod_1.z.number().positive().optional(),
    maxInvestment: zod_1.z.number().positive().optional(),
    description: zod_1.z.string().optional(),
});
function aiGenerateDescription(input) {
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
    const riskDesc = riskDescriptions[input.riskLevel] || 'moderate risk';
    const typeDesc = typeDescriptions[input.investmentType] || 'investment product';
    return `${input.name} is a ${typeDesc} designed as a ${riskDesc}. This investment opportunity is suitable for investors seeking ${input.riskLevel === 'low' ? 'capital preservation' : input.riskLevel === 'high' ? 'aggressive growth' : 'balanced returns'} and can be an excellent addition to a well-diversified portfolio. The product offers professional management and follows industry best practices for risk management.`;
}
function mapProductRow(row) {
    if (!row)
        return row;
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
exports.productsRouter.post('/', auth_1.requireAuth, async (req, res) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { name, investmentType, tenureMonths, annualYield, riskLevel, minInvestment, maxInvestment, description } = parsed.data;
    const desc = description ?? aiGenerateDescription({ name, investmentType, riskLevel });
    const id = node_crypto_1.default.randomUUID();
    await (0, database_1.executeQuery)(`INSERT INTO investment_products (id, name, investment_type, tenure_months, annual_yield, risk_level, min_investment, max_investment, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, name, investmentType, tenureMonths, annualYield, riskLevel, minInvestment ?? 500, maxInvestment ?? null, desc]);
    const rows = await (0, database_1.executeQuery)('SELECT * FROM investment_products WHERE id = ?', [id]);
    res.status(201).json(mapProductRow(rows[0]));
});
// Admin update
exports.productsRouter.put('/:id', auth_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    const parsed = productSchema.partial().safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const fields = parsed.data;
    const sets = [];
    const vals = [];
    const mapping = {
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
        vals.push(fields[key]);
    }
    if (sets.length === 0)
        return res.json({});
    await (0, database_1.executeQuery)(`UPDATE investment_products SET ${sets.join(', ')} WHERE id = ?`, [...vals, id]);
    const rows = await (0, database_1.executeQuery)('SELECT * FROM investment_products WHERE id = ?', [id]);
    res.json(mapProductRow(rows[0]));
});
// Admin delete
exports.productsRouter.delete('/:id', auth_1.requireAuth, async (req, res) => {
    const id = String(req.params.id);
    await (0, database_1.executeQuery)('DELETE FROM investment_products WHERE id = ?', [id]);
    res.status(204).send();
});
// List
exports.productsRouter.get('/', async (_req, res) => {
    const products = await (0, database_1.executeQuery)('SELECT * FROM investment_products ORDER BY created_at DESC');
    res.json(products.map(mapProductRow));
});
// Get by id
exports.productsRouter.get('/:id', async (req, res) => {
    const id = String(req.params.id);
    const rows = await (0, database_1.executeQuery)('SELECT * FROM investment_products WHERE id = ?', [id]);
    const product = mapProductRow(rows[0]);
    if (!product)
        return res.status(404).json({ error: 'Product not found' });
    res.json(product);
});
// AI recommendations
exports.productsRouter.get('/recommendations', auth_1.requireAuth, async (req, res) => {
    const userId = req.userId;
    const users = await (0, database_1.executeQuery)('SELECT risk_appetite FROM users WHERE id = ?', [userId]);
    if (users.length === 0)
        return res.status(404).json({ error: 'User not found' });
    const user = users[0];
    const map = {
        low: ['low'],
        moderate: ['low', 'moderate'],
        high: ['moderate', 'high'],
    };
    const risks = map[user.risk_appetite] ?? ['low', 'moderate'];
    const placeholders = risks.map(() => '?').join(',');
    const products = await (0, database_1.executeQuery)(`SELECT * FROM investment_products WHERE risk_level IN (${placeholders}) LIMIT 10`, risks);
    res.json({ products: products.map(mapProductRow), rationale: `Based on your ${user.risk_appetite} risk appetite` });
});
