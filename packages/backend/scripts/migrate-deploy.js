#!/usr/bin/env node
/**
 * Database migration script for production deployments
 * Runs Prisma migrations and handles connection pooling
 */

import { spawn } from "child_process";
import { process, exit } from "process";
import console from "console";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  exit(1);
}

console.log("🔄 Running database migrations...");

// Use prisma migrate deploy for production (applies migrations without prompts)
const migrate = spawn("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL },
});

migrate.on("error", (error) => {
  console.error("❌ Migration failed:", error);
  exit(1);
});

migrate.on("exit", (code) => {
  if (code === 0) {
    console.log("✅ Database migrations completed successfully");
    exit(0);
  } else {
    console.error(`❌ Migration process exited with code ${code}`);
    exit(code || 1);
  }
});
