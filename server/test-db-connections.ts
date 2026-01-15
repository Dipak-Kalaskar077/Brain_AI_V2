// filepath: c:\Users\Dipak\Desktop\Career\My Own Projects\Dipak Personal AI Assistant\Final Dipak AI working\DipakPersonalAi\server\test-db-connection.ts
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("Database connected successfully!");
    await connection.end();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
}

testDatabaseConnection();