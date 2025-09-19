import request from 'supertest';
import express from 'express';
import { authRouter } from '../tabs/auth';
import { executeQuery } from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock the database
jest.mock('../database');
const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;

// Mock bcrypt
jest.mock('bcryptjs');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

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

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('ai_feedback');
      expect(mockExecuteQuery).toHaveBeenCalledWith(
        'SELECT id FROM users WHERE email = ?',
        ['test@example.com']
      );
    });

    it('should return error for existing user', async () => {
      mockExecuteQuery.mockResolvedValueOnce([{ id: 'existing-user' }]);

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John'
      };

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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
      const response = await request(app)
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
      const response = await request(app)
        .post('/api/auth/password-reset')
        .send({
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});
