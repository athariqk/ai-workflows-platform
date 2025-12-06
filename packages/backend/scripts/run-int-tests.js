#!/usr/bin/env node
/* Start a dockerized Postgres for tests, apply schema, run tests, then teardown. */
import console from "console";
import process from "process";
import { spawnSync, spawn } from "child_process";
import { setTimeout } from "timers/promises";
import { Client } from "pg";

const COMPOSE_FILE = "./docker-compose.test.yml";
const DB_URL = "postgresql://postgres:postgres@localhost:5433/postgres";

function run(cmd, args, opts = {}) {
  console.log(`> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...opts });
  if (r.error) throw r.error;
  if (r.status && r.status !== 0) throw new Error(`${cmd} exited ${r.status}`);
}

async function waitForPostgres(retries = 30, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new Client({ connectionString: DB_URL });
      await client.connect();
      await client.end();
      console.log("Postgres is ready");
      return;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      process.stdout.write(".");
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Postgres did not become ready in time");
}

async function main() {
  try {
    // Start docker compose
    run("docker-compose", ["-f", COMPOSE_FILE, "up", "-d"]);

    // Wait for DB
    console.log("Waiting for Postgres to become ready");
    await waitForPostgres(60, 1000);

    // Apply schema using Prisma (db push)
    console.log("\nApplying schema with prisma db push");
    run("npx", ["prisma", "db", "push", "--schema=./prisma/schema.prisma"], {
      shell: true,
      env: { ...process.env, DATABASE_URL: DB_URL },
    });

    // Run integration tests with Vitest (matches *.int.test.ts)
    console.log("\nRunning integration tests (vitest)");
    const test = spawn("npx", ["vitest", "run", "--project", "integration", "--passWithNoTests"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, DATABASE_URL: DB_URL },
    });

    test.on("exit", (code) => {
      console.log(`tests exited with ${code}`);
      try {
        run("docker-compose", ["-f", COMPOSE_FILE, "down", "--volumes"]);
      } catch (e) {
        console.error("Failed to teardown docker compose:", e);
      }
      process.exit(code || 0);
    });

    test.on("error", (err) => {
      console.error("Failed to run tests:", err);
      process.exit(1);
    });
  } catch (err) {
    console.error(err);
    run("docker-compose", ["-f", COMPOSE_FILE, "down", "--volumes"]);
    process.exit(1);
  }
}

main();
