/**
 * Environment variable validation and configuration
 * This ensures all required environment variables are present before the app starts
 */

import dotenv from "dotenv";

/**
 * Load environment variables from .env file
 * MUST be called before accessing process.env
 */
dotenv.config();

/**
 * Environment variable validation and configuration
 * This ensures all required environment variables are present before the app starts
 */


// Validate required environment variables
const requiredEnvVars = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
} as const;


// Optional but recommended environment variables
const optionalEnvVars = {
  SESSION_SECRET: process.env.SESSION_SECRET,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL,
} as const;

// Validate required variables
export function validateEnv() {
  const missing: string[] = [];

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value || value.trim() === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  // Warn about missing SESSION_SECRET in production
  if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
    console.warn(
      '⚠️  WARNING: SESSION_SECRET is not set in production. This is a security risk!'
    );
  }

  return true;
}

console.log("ENV SOURCE CHECK → GEMINI_API_KEY:", process.env.GEMINI_API_KEY);
console.log("ENV CHECK FULL KEY:", process.env.GEMINI_API_KEY);


// Export validated environment variables
export const env = {
  
  // API Keys
  GEMINI_API_KEY: requiredEnvVars.GEMINI_API_KEY!,
  
  // Server
  PORT: optionalEnvVars.PORT ? parseInt(optionalEnvVars.PORT, 10) : 5000,
  NODE_ENV: optionalEnvVars.NODE_ENV as 'development' | 'production' | 'test',
  
  // Security
  SESSION_SECRET: optionalEnvVars.SESSION_SECRET,
  
  // Frontend
  FRONTEND_URL: optionalEnvVars.FRONTEND_URL,
} as const;

