import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from '../models/schema';
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
}

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });


pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
});

export default db;