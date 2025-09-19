import request from 'supertest';
import express from 'express';
import { productsRouter } from '../tabs/products';
import { executeQuery } from '../database';
import jwt from 'jsonwebtoken';

// Mock the database
jest.mock('../database');
const mockExecuteQuery = executeQuery as jest.MockedFunction<typeof executeQuery>;

// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

// Mock auth middleware
const mockAuth = (req: any, res: any, next: any) => {
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

      const response = await request(app)
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

      const response = await request(app)
        .get('/api/products/product-1');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 'product-1');
      expect(response.body).toHaveProperty('name', 'Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      mockExecuteQuery.mockResolvedValueOnce([]);

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
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

      const response = await request(app)
        .get('/api/products/recommendations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('rationale');
      expect(response.body.products).toHaveLength(1);
    });
  });
});
