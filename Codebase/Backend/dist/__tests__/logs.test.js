"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const logs_1 = require("../tabs/logs");
const database_1 = require("../database");
// Mock the database
jest.mock('../database');
const mockExecuteQuery = database_1.executeQuery;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/logs', logs_1.logsRouter);
// Mock auth middleware
const mockAuth = (req, res, next) => {
    req.userId = 'test-user-id';
    req.userEmail = 'test@example.com';
    next();
};
// Apply mock auth to all routes
app.use('/api/logs', mockAuth);
describe('Logs Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/logs/user/:userId', () => {
        it('should return user logs', async () => {
            const mockLogs = [
                {
                    id: 1,
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    endpoint: '/api/investments',
                    http_method: 'POST',
                    status_code: 201,
                    error_message: null,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockLogs);
            const response = await (0, supertest_1.default)(app)
                .get('/api/logs/user/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toHaveProperty('id', 1);
            expect(response.body[0]).toHaveProperty('userId', 'test-user-id');
            expect(response.body[0]).toHaveProperty('endpoint', '/api/investments');
        });
        it('should return empty array for user with no logs', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/logs/user/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(0);
        });
    });
    describe('GET /api/logs/user/me', () => {
        it('should return current user logs', async () => {
            const mockLogs = [
                {
                    id: 1,
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    endpoint: '/api/investments',
                    http_method: 'POST',
                    status_code: 201,
                    error_message: null,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockLogs);
            const response = await (0, supertest_1.default)(app)
                .get('/api/logs/user/me');
            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.headers).toHaveProperty('cache-control', 'no-cache, no-store, must-revalidate');
        });
    });
    describe('GET /api/logs/summary/:userId', () => {
        it('should return error summary', async () => {
            const mockLogs = [
                {
                    id: 1,
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    endpoint: '/api/investments',
                    http_method: 'POST',
                    status_code: 500,
                    error_message: 'Database error',
                    created_at: '2024-01-01T00:00:00Z'
                },
                {
                    id: 2,
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    endpoint: '/api/products',
                    http_method: 'GET',
                    status_code: 200,
                    error_message: null,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockLogs);
            const response = await (0, supertest_1.default)(app)
                .get('/api/logs/summary/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('summary');
            expect(response.body.summary).toContain('1 error(s)');
        });
        it('should return summary for user with no errors', async () => {
            const mockLogs = [
                {
                    id: 1,
                    user_id: 'test-user-id',
                    email: 'test@example.com',
                    endpoint: '/api/investments',
                    http_method: 'POST',
                    status_code: 200,
                    error_message: null,
                    created_at: '2024-01-01T00:00:00Z'
                }
            ];
            mockExecuteQuery.mockResolvedValueOnce(mockLogs);
            const response = await (0, supertest_1.default)(app)
                .get('/api/logs/summary/test-user-id');
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('summary');
            expect(response.body.summary).toContain('0 error(s)');
        });
    });
});
