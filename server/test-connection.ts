import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

async function testConnection() {
  // Validate required environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  const config = {
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!
  };

  try {
    console.log('Attempting to connect with:', {
      host: config.host,
      user: config.user,
      database: config.database
    });

    const connection = await mysql.createConnection(config);
    
    console.log('Successfully connected to database!');
    
    // Test query to verify permissions
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('Tables in database:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();