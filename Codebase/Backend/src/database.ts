import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'dev@1234@',
  database: 'grip_invest',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timeout: 60000,
  reconnect: true
});

export default pool;

// Helper function to execute queries
export async function executeQuery(query: string, params: any[] = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to execute transactions
export async function executeTransaction(queries: { query: string; params: any[] }[]) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
