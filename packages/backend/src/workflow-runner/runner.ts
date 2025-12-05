import Queue from "bee-queue";
import { executeWorkflowJob } from "./engine.js";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);

// Create a worker for workflow execution (process jobs from redis)
const workflowQueue = new Queue("workflow-execution", {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
  },
  removeOnSuccess: false,
  removeOnFailure: false,
  stallInterval: 5000,
});

export function startWorker(): void {
  workflowQueue.process(async (job) => {
    return executeWorkflowJob(job);
  });

  workflowQueue.on("ready", () => {
    console.log("✓ Workflow queue worker is ready");
  });

  workflowQueue.on("error", (err) => {
    console.error("✗ Queue error:", err);
  });

  workflowQueue.on("succeeded", (job, result) => {
    console.log(`✓ Job ${job.id} succeeded:`, result);
  });

  workflowQueue.on("failed", (job, err) => {
    console.error(`✗ Job ${job.id} failed:`, err.message);
  });

  workflowQueue.on("retrying", (job, err) => {
    console.log(`⟳ Job ${job.id} retrying after error:`, err.message);
  });
}
