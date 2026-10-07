import mysql from 'mysql2/promise';

/**
 * MySQL Connection Utility
 */

let pool: mysql.Pool | null = null;
let isConnected = false;

/**
 * Initialize the database connection pool.
 * Called once when the app starts.
 */
export async function initializePool() {
  if (pool && isConnected) return pool;

  const host = process.env.DATABASE_HOST || 'localhost';
  const port = Number(process.env.DATABASE_PORT) || 3306;
  const user = process.env.DATABASE_USER || 'root';
  const password = process.env.DATABASE_PASSWORD || '';
  const database = process.env.DATABASE_NAME || 'test';
  const useSsl = process.env.DATABASE_SSL === 'true';

  console.log('🔄 Attempting to connect to MySQL...');
  console.log('   Host:', host);
  console.log('   Port:', port);
  console.log('   User:', user);
  console.log('   Database:', database);
  console.log('   SSL:', useSsl);
  console.log('   Password length:', password.length);

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // MySQL DECIMALs come back as strings by default — force numbers
      decimalNumbers: true,
      // Aiven requires SSL
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    isConnected = true;
    console.log('✅ Database pool initialized successfully');
    return pool;
  } catch (error) {
    pool = null;
    isConnected = false;
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Database connection failed:', msg);
    console.error('   Full error:', error);
    throw new Error(`Database connection failed: ${msg}`);
  }
}

/**
 * Get existing pool or throw if not initialized.
 */
export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Check if database is connected.
 */
export function isDbConnected() {
  return isConnected;
}

/**
 * Execute a SELECT query that returns multiple rows.
 */
export async function query<T>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  if (!pool || !isConnected) {
    await initializePool();
  }
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(sql, params);
    return rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute a query that returns a single row.
 */
export async function queryOne<T>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute INSERT, UPDATE, DELETE queries.
 */
export async function execute(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<{ lastId: number; affectedRows: number }> {
  if (!pool) {
    await initializePool();
  }
  if (!pool) {
    throw new Error('Database pool not initialized');
  }

  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(sql, params);
    const okPacket = result as mysql.OkPacket;
    return {
      lastId: okPacket.insertId,
      affectedRows: okPacket.affectedRows,
    };
  } catch (error) {
    console.error('Database execute error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close all connections in the pool (run on app shutdown).
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    console.log('✅ Database pool closed');
    pool = null;
    isConnected = false;
  }
}