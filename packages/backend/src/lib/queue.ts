import Queue from "bee-queue";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_DB = parseInt(process.env.REDIS_DB || "0", 10);

// Create a queue for workflow execution (post jobs to redis)
export const workflowQueue = new Queue("workflow-execution", {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: REDIS_DB,
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
