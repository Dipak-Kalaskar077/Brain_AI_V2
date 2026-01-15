import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Note: Environment validation is done in server/env.ts
// This file assumes env vars are validated before this module is imported

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds
  multipleStatements: false,
};

const createPool = async () => {
  try {
    const pool = mysql.createPool(poolConfig);
    
    // Test the connection
    await pool.getConnection().then(conn => {
      console.log('Database connection established successfully');
      conn.release();
    });
    
    return pool;
  } catch (error) {
    console.error('Failed to create connection pool:', error);
    throw error;
  }
};

let poolConnection: mysql.Pool | null = null;
let isConnecting = false;
let connectionError: Error | null = null;

// Initialize pool with retry logic and connection state management
const initializePool = async (retries = 3, delay = 5000): Promise<mysql.Pool> => {
  if (poolConnection && !connectionError) {
    return poolConnection;
  }

  if (isConnecting) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return initializePool(retries, delay);
  }

  isConnecting = true;
  try {
    poolConnection = await createPool();
    connectionError = null;
    isConnecting = false;
    return poolConnection;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying database connection in ${delay/1000} seconds... (${retries} attempts remaining)`);
      isConnecting = false;
      await new Promise(resolve => setTimeout(resolve, delay));
      return initializePool(retries - 1, delay);
    }
    connectionError = error as Error;
    isConnecting = false;
    throw error;
  }
};

// Initialize the pool
initializePool().catch(error => {
  console.error('Failed to initialize database pool after all retries:', error);
  process.exit(1);
});

// Helper function to ensure connection is available
const ensureConnection = async () => {
  if (!poolConnection || connectionError) {
    return initializePool();
  }
  return poolConnection;
};

// Lazy initialization pattern for drizzle instance
let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!dbInstance) {
    const pool = await ensureConnection();
    dbInstance = drizzle(pool, { schema, mode: 'default' });
  }
  return dbInstance;
}

// Export pool and connection status check
export { poolConnection, ensureConnection };
