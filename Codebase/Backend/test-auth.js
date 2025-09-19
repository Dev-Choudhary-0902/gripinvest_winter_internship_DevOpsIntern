const jwt = require('jsonwebtoken');

// Test with the secret from .env file
const JWT_SECRET = 'your-super-secret-jwt-key-here';

// Generate a test token for demo@gmail.com user
const payload = {
  userId: 'e7e693bb-4f2f-4872-8661-dd2262434b26', // Actual user ID from database
  email: 'demo@gmail.com'
};

const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated token with correct secret:', token);

// Test the token
const testToken = async () => {
  try {
    const response = await fetch('http://localhost:4000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
    } else {
      const error = await response.text();
      console.log('API Error:', error);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};

// Start the server first, then test
console.log('Starting server...');
const { spawn } = require('child_process');
const server = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

setTimeout(() => {
  console.log('Testing token...');
  testToken();
}, 5000);
