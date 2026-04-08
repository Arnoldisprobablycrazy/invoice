import mysql from 'mysql2/promise';

/**
 * MySQL Connection Utility
 * 
 * WHY THIS EXISTS:
 * - mysql2/promise provides connection pooling (reuses connections)
 * - Connection pooling is more efficient than creating new connection per query
 * - Pool handles multiple concurrent requests without overwhelming database
 * - Automatic connection management (creation, cleanup, error handling)
 */

let pool: mysql.Pool | null = null;
let isConnected = false;

/**
 * Initialize the database connection pool
 * Called once when the app starts
 */
export async function initializePool() {
  if (pool && isConnected) return pool;

  try {
    console.log('🔄 Attempting to connect to MySQL...');
    
    pool = mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'test',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    
    isConnected = true;
    console.log('✅ Database pool initialized successfully');
    return pool;
  } catch (error) {
    pool = null;
    isConnected = false;
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : String(error));
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get existing pool or initialize new one
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Check if database is connected
 */
export function isDbConnected() {
  return isConnected;
}

/**
 * Execute a SELECT query that returns multiple rows
 * 
 * @param query - SQL query with ? placeholders
 * @param params - Parameters to replace ? placeholders
 * @returns Array of rows
 */
export async function query<T>(
  sql: string,
  params: (string | number | boolean)[] = []
): Promise<T[]> {
  try {
    if (!pool || !isConnected) {
      await initializePool();
    }
    
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    connection.release();
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a query that returns a single row
 * 
 * @param query - SQL query with ? placeholders
 * @param params - Parameters to replace ? placeholders
 * @returns Single row object or null
 */
export async function queryOne<T>(
  sql: string,
  params: (string | number | boolean)[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute INSERT, UPDATE, DELETE queries
 * 
 * @param query - SQL query with ? placeholders
 * @param params - Parameters to replace ? placeholders
 * @returns Object with insertId, affectedRows, etc.
 */
export async function execute(
  sql: string,
  params: (string | number | boolean)[] = []
): Promise<{ lastId: number; affectedRows: number }> {
  try {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    
    const connection = await pool.getConnection();
    const [result] = await connection.execute(sql, params);
    connection.release();
    
    // Cast to OkPacket to access these properties
    const okPacket = result as mysql.OkPacket;
    return {
      lastId: okPacket.insertId,
      affectedRows: okPacket.affectedRows,
    };
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  }
}

/**
 * Close all connections in the pool (run on app shutdown)
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    console.log('✅ Database pool closed');
    pool = null;
    isConnected = false;
  }
}
