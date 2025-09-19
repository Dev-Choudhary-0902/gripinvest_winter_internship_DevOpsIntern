"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const products_1 = require("../tabs/products");
const database_1 = require("../database");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock the database
jest.mock('../database');
const mockExecuteQuery = database_1.executeQuery;
// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jsonwebtoken_1.default;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/products', products_1.productsRouter);
// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.userId = 'test-user-id';
    req.userEmail = 'test@example.com';
    next();
};
// Apply mock auth to all routes
app.use('/api/products', mockAuth);
describe('Products Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/products', () => {
        it('should return all products', async () => {
            const mockProducts = [
                {
                    id: 'product-1',
                    name: 'Test Product',
                    investment_type: 'mf',
                    tenure_months: 12,
                    annual_yield: 8.5,
                    risk_level: 'moderate',
                    min_investment: 1000,
                    max_investment: 100000,
                    description: 'Test description',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockProducts);
            const response = await (0, supertest_1.default)(app)
                .get('/api/products');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('id', 'product-1');
            expect(response.body[0]).toHaveProperty('name', 'Test Product');
        });
    });
    describe('GET /api/products/:id', () => {
        it('should return specific product', async () => {
            const mockProduct = {
                id: 'product-1',
                name: 'Test Product',
                investment_type: 'mf',
                tenure_months: 12,
                annual_yield: 8.5,
                risk_level: 'moderate',
                min_investment: 1000,
                max_investment: 100000,
                description: 'Test description',
                created_at: '2024-01-01',
                updated_at: '2024-01-01'
            };
            mockExecuteQuery.mockResolvedValueOnce([mockProduct]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/products/product-1');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id', 'product-1');
            expect(response.body).toHaveProperty('name', 'Test Product');
        });
        it('should return 404 for non-existent product', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/products/non-existent');
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Product not found');
        });
    });
    describe('POST /api/products', () => {
        it('should create new product', async () => {
            const productData = {
                name: 'New Product',
                investmentType: 'mf',
                tenureMonths: 12,
                annualYield: 8.5,
                riskLevel: 'moderate',
                minInvestment: 1000,
                maxInvestment: 100000,
                description: 'New product description'
            };
            mockExecuteQuery.mockResolvedValueOnce([]); // For the INSERT
            mockExecuteQuery.mockResolvedValueOnce([{
                    id: 'new-product-id',
                    name: 'New Product',
                    investment_type: 'mf',
                    tenure_months: 12,
                    annual_yield: 8.5,
                    risk_level: 'moderate',
                    min_investment: 1000,
                    max_investment: 100000,
                    description: 'New product description',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01'
                }]);
            const response = await (0, supertest_1.default)(app)
                .post('/api/products')
                .send(productData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name', 'New Product');
        });
        it('should return validation error for invalid data', async () => {
            const invalidData = {
                name: '',
                investmentType: 'invalid',
                tenureMonths: -1,
                annualYield: -5
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/products')
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/products/recommendations', () => {
        it('should return recommendations based on user risk appetite', async () => {
            const mockUser = { risk_appetite: 'moderate' };
            const mockProducts = [
                {
                    id: 'product-1',
                    name: 'Moderate Risk Product',
                    investment_type: 'mf',
                    tenure_months: 12,
                    annual_yield: 8.5,
                    risk_level: 'moderate',
                    min_investment: 1000,
                    max_investment: 100000,
                    description: 'Moderate risk product',
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce([mockUser]);
            mockExecuteQuery.mockResolvedValueOnce(mockProducts);
            const response = await (0, supertest_1.default)(app)
                .get('/api/products/recommendations');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('products');
            expect(response.body).toHaveProperty('rationale');
            expect(response.body.products).toHaveLength(1);
        });
    });
});
