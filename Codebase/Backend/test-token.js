const jwt = require('jsonwebtoken');

// Generate a test token for demo@gmail.com user
const payload = {
  userId: 'e7e693bb-4f2f-4872-8661-dd2262434b26', // Actual user ID from database
  email: 'demo@gmail.com'
};

const token = jwt.sign(payload, 'your-super-secret-jwt-key-here', { expiresIn: '24h' });

console.log('Generated token:', token);
console.log('Test this token in the frontend by setting it in localStorage as "grip-invest-token"');
