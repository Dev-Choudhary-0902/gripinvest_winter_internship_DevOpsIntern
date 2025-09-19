"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const investments_1 = require("../tabs/investments");
const database_1 = require("../database");
// Mock the database
jest.mock('../database');
const mockExecuteQuery = database_1.executeQuery;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/investments', investments_1.investmentsRouter);
// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.userId = 'test-user-id';
    req.userEmail = 'test@example.com';
    next();
};
// Apply mock auth to all routes
app.use('/api/investments', mockAuth);
describe('Investments Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/investments', () => {
        it('should create investment successfully', async () => {
            const mockUser = [{ id: 'test-user-id' }];
            const mockProduct = [{ id: 'product-1', annual_yield: 8.5 }];
            mockExecuteQuery
                .mockResolvedValueOnce(mockUser) // User exists check
                .mockResolvedValueOnce(mockProduct) // Product exists check
                .mockResolvedValueOnce([]) // Investment insert
                .mockResolvedValueOnce([]); // Transaction log insert
            const investmentData = {
                productId: 'product-1',
                amount: 10000
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/investments')
                .send(investmentData);
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('message', 'Investment successful');
            expect(response.body).toHaveProperty('amount', 10000);
            expect(response.body).toHaveProperty('expectedReturn');
        });
        it('should return error for non-existent user', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]); // No user found
            const investmentData = {
                productId: 'product-1',
                amount: 10000
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/investments')
                .send(investmentData);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User or product not found');
        });
        it('should return error for non-existent product', async () => {
            const mockUser = [{ id: 'test-user-id' }];
            mockExecuteQuery
                .mockResolvedValueOnce(mockUser) // User exists
                .mockResolvedValueOnce([]); // No product found
            const investmentData = {
                productId: 'non-existent-product',
                amount: 10000
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/investments')
                .send(investmentData);
            expect(response.status).toBe(404);
            expect(response.body.error).toBe('User or product not found');
        });
        it('should return validation error for invalid data', async () => {
            const invalidData = {
                productId: 'invalid-uuid',
                amount: -1000
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/investments')
                .send(invalidData);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/investments/portfolio', () => {
        it('should return user portfolio', async () => {
            const mockInvestments = [
                {
                    id: 'investment-1',
                    user_id: 'test-user-id',
                    product_id: 'product-1',
                    amount: 10000,
                    invested_at: '2024-01-01',
                    status: 'active',
                    expected_return: 10850,
                    maturity_date: '2025-01-01',
                    product_name: 'Test Product',
                    product_risk_level: 'moderate',
                    product_annual_yield: 8.5
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockInvestments);
            const response = await (0, supertest_1.default)(app)
                .get('/api/investments/portfolio');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('count');
            expect(response.body).toHaveProperty('breakdown');
            expect(response.body).toHaveProperty('investments');
            expect(response.body).toHaveProperty('ai_summary');
            expect(response.body.investments).toHaveLength(1);
        });
        it('should return empty portfolio for new user', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/investments/portfolio');
            expect(response.status).toBe(200);
            expect(response.body.total).toBe(0);
            expect(response.body.count).toBe(0);
            expect(response.body.investments).toHaveLength(0);
        });
    });
});
