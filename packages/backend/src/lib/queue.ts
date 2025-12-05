import Queue from "bee-queue";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/0";

// Create a queue for workflow execution (post jobs to redis)
export const workflowQueue = new Queue("workflow-execution", {
  redis: {
    url: REDIS_URL,
  },
  isWorker: false,
  removeOnSuccess: false,
  removeOnFailure: false,
  stallInterval: 5000,
});

export interface WorkflowJobData {
  workflowId: string;
  runId: string;
}
