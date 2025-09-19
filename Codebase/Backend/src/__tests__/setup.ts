import 'dotenv/config';

// Mock database for tests
jest.mock('../database', () => ({
  executeQuery: jest.fn(),
}));

// Mock JWT secret for tests
process.env.JWT_SECRET = 'test-secret-key';

// Mock crypto for UUID generation
jest.mock('node:crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-123'),
}));
