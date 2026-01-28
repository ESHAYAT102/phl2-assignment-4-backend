import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

// Create Prisma client
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

console.log("Database: Using DATABASE_URL:", connectionString.substring(0, 30) + "...");

// Setup Neon configuration
neonConfig.webSocketConstructor = ws;

// Create Neon adapter with connection string
const adapter = new PrismaNeon({ connectionString });

export const prisma = new PrismaClient({
  adapter,
});

// Test connection
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✓ Database connected successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    throw error;
  }
}