const mysql = require('mysql2/promise');

async function createDemoUser() {
  try {
    // Create connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'grip_invest'
    });

    console.log('Connected to database');

    // Check if user exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      ['demo@gmail.com']
    );

    if (existingUsers.length > 0) {
      console.log('Demo user already exists');
      return;
    }

    // Create demo user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await connection.execute(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, risk_appetite, created_at, updated_at) 
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), NOW())`,
      ['Demo', 'User', 'demo@gmail.com', hashedPassword, 'moderate']
    );

    console.log('Demo user created successfully');
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('Error creating demo user:', error);
  }
}

createDemoUser();
