const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    // Create connection using the same config as the backend
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'dev@1234@',
      database: 'grip_invest'
    });

    console.log('Connected to database');

    // Get all users
    const [users] = await connection.execute('SELECT id, first_name, last_name, email FROM users');
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}) - ID: ${user.id}`);
    });
    
    // Find demo@gmail.com user
    const demoUser = users.find(user => user.email === 'demo@gmail.com');
    if (demoUser) {
      console.log('\nDemo user found:');
      console.log(`ID: ${demoUser.id}`);
      console.log(`Name: ${demoUser.first_name} ${demoUser.last_name}`);
      console.log(`Email: ${demoUser.email}`);
    }

    if (users.length === 0) {
      console.log('No users found in database');
    }
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers();
