import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a pool and export it once
const connectionPool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: connectionPool, schema });

// Add connection testing function
export async function testConnection() {
  try {
    const client = await connectionPool.connect();
    console.log('Database connection successful');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err);
    return false;
  }
}

// Export the pool for potential direct usage
export { connectionPool as pool };