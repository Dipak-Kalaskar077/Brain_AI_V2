import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";
import dotenv from "dotenv";

// Load env vars locally (Render ignores .env and injects real ones)
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });

// Optional: simple connection test (logs once on startup)
if (process.env.NODE_ENV === "production") {
  pool.query("SELECT 1")
    .then(() => console.log("PostgreSQL connected successfully 🧠✅"))
    .catch((err) => {
      console.error("PostgreSQL connection failed ❌", err);
      process.exit(1);
    });
}

