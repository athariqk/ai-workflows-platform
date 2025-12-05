import Queue from "bee-queue";
import { executeWorkflowJob } from "./engine.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

// Create a worker for workflow execution (process jobs from redis)
const workflowQueue = new Queue("workflow-execution", {
  redis: {
    url: REDIS_URL,
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
