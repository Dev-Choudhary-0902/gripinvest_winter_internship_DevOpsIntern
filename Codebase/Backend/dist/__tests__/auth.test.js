"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = require("../tabs/auth");
const database_1 = require("../database");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Mock the database
jest.mock('../database');
const mockExecuteQuery = database_1.executeQuery;
// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcryptjs_1.default;
// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jsonwebtoken_1.default;
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.authRouter);
describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('POST /api/auth/signup', () => {
        it('should create a new user successfully', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]); // No existing user
            mockBcrypt.hash.mockResolvedValueOnce('hashed-password');
            mockJwt.sign.mockReturnValueOnce('jwt-token');
            const userData = {
                email: 'test@example.com',
                password: 'password123',
                firstName: 'John',
                lastName: 'Doe',
                riskAppetite: 'moderate'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/signup')
                .send(userData);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('ai_feedback');
            expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT id FROM users WHERE email = ?', ['test@example.com']);
        });
        it('should return error for existing user', async () => {
            mockExecuteQuery.mockResolvedValueOnce([{ id: 'existing-user' }]);
            const userData = {
                email: 'existing@example.com',
                password: 'password123',
                firstName: 'John'
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/signup')
                .send(userData);
            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Email already registered');
        });
        it('should return validation error for invalid data', async () => {
            const userData = {
                email: 'invalid-email',
                password: '123',
                firstName: ''
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/signup')
                .send(userData);
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('POST /api/auth/login', () => {
        it('should login user successfully', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                first_name: 'John',
                last_name: 'Doe',
                risk_appetite: 'moderate'
            };
            mockExecuteQuery.mockResolvedValueOnce([mockUser]);
            mockBcrypt.compare.mockResolvedValueOnce(true);
            mockJwt.sign.mockReturnValueOnce('jwt-token');
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
        });
        it('should return error for invalid credentials', async () => {
            mockExecuteQuery.mockResolvedValueOnce([]);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
        it('should return error for wrong password', async () => {
            const mockUser = {
                id: 'user-123',
                email: 'test@example.com',
                password_hash: 'hashed-password',
                first_name: 'John',
                last_name: 'Doe',
                risk_appetite: 'moderate'
            };
            mockExecuteQuery.mockResolvedValueOnce([mockUser]);
            mockBcrypt.compare.mockResolvedValueOnce(false);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid credentials');
        });
    });
    describe('POST /api/auth/password-reset', () => {
        it('should initiate password reset', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/password-reset')
                .send({
                email: 'test@example.com'
            });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('otp');
            expect(response.body).toHaveProperty('ai_feedback');
        });
        it('should return validation error for invalid email', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/password-reset')
                .send({
                email: 'invalid-email'
            });
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });
});
