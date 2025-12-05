import { prisma } from "@/lib/prisma.js";
import uuidv7 from "@/lib/uuid-v7.js";
import type { WorkflowJobData } from "@/lib/queue.js";
import AgentStep from "@/workflow-runner/steps/agent-step.js";
import { workflow_node_type } from "@/generated/prisma/enums.js";
import Step from "./steps/step.js";
import { Job } from "bee-queue";
import TextInputStep from "./steps/text-input-step.js";

interface WorkflowNodeData {
  id: string;
  step: Step;
}

interface WorkflowChain {
  data: WorkflowNodeData[];
}

interface ExecutionContext {
  lastOutput?: string;
  runId: string;
  workflowId: string;
}

async function buildWorkflowChain(workflowId: string): Promise<WorkflowChain> {
  const [nodes, edges] = await Promise.all([
    prisma.workflow_node.findMany({
      where: { workflow_id: workflowId },
    }),
    prisma.workflow_edge.findMany({
      where: { workflow_id: workflowId },
    }),
  ]);

  const nodeMap = new Map<string, string>();
  const targetNodes = new Set<string>();
  for (const edge of edges) {
    if (!edge.source_node_id || !edge.target_node_id) {
      throw new Error("Workflow edge is missing either source node or target node");
    }
    nodeMap.set(edge.source_node_id, edge.target_node_id);
    targetNodes.add(edge.target_node_id);
  }

  const startNodes = nodes.filter((node: { id: string; }) => !targetNodes.has(node.id));
  if (startNodes.length > 1) {
    throw new Error("Workflow chain does not support multiple start nodes");
  }
  if (!startNodes || startNodes.length === 0) {
    throw new Error("Workflow chain has no start node");
  }

  const chain: WorkflowChain = { data: [] }
  let currentNode = startNodes[0];
  while (currentNode) {
    let step: Step;

    switch (currentNode.type) {
      case workflow_node_type.agent:
        // Parse config JSON to get agent configuration
        {
          const config = currentNode.config as { agent: { id: string } } | null;
          if (!config?.agent?.id) {
            throw new Error(`Agent node ${currentNode.id} is missing agentId in config`);
          }
          step = new AgentStep(config?.agent.id);
          break;
        }
      case workflow_node_type.text_input:
        {
          const config = currentNode.config as { value: string } | null;
          step = new TextInputStep(config?.value || "")
          break;
        }
      default:
        throw new Error(`Unsupported node type in workflow chain: ${currentNode.type}`);
    }

    chain.data.push({
      id: currentNode.id,
      step,
    });

    const nextId = nodeMap.get(currentNode.id);
    currentNode = nextId ? nodes.find((n: { id: string; }) => n.id === nextId) : undefined;
  }

  return chain;
}

/**
 * Execute workflow linearly step by step
 */
async function executeWorkflow(
  job: Job<WorkflowJobData>,
  chain: WorkflowChain,
  context: ExecutionContext,
): Promise<void> {
  for (const currentNode of chain.data) {
    const stepLogId = uuidv7();

    const stepInput = context.lastOutput;

    try {
      // Create step log entry
      await prisma.step_log.create({
        data: {
          id: stepLogId,
          run_id: context.runId,
          node_id: currentNode.id,
          started_at: new Date(),
          status: "running",
        },
      });

      job.reportProgress({
        currentNodeId: currentNode.id,
        status: "running"
      });

      // Execute the step
      const output = await currentNode.step.execute(stepInput);

      // Store output in context
      context.lastOutput = output;

      // Update step log with success
      await prisma.step_log.update({
        where: { id: stepLogId },
        data: {
          finished_at: new Date(),
          status: "completed",
        },
      });

      job.reportProgress({
        currentNodeId: currentNode.id,
        status: "completed",
        output: output
      });
    } catch (error) {
      // Update step log with failure
      await prisma.step_log.update({
        where: { id: stepLogId },
        data: {
          finished_at: new Date(),
          status: "failed",
          error: (error as Error).message,
        },
      });

      job.reportProgress({
        currentNodeId: currentNode.id,
        status: "failed",
        error: (error as Error).message
      });

      throw error;
    }
  }
}

/**
 * Main workflow execution handler
 */
export async function executeWorkflowJob(
  job: Job<WorkflowJobData>,
): Promise<{ success: boolean; runId: string; error: string | null }> {
  const { workflowId, runId } = job.data;

  try {
    await prisma.run_log.update({
      where: { id: runId },
      data: {
        status: "running",
        started_at: new Date(),
      },
    });

    job.reportProgress({
      currentNodeId: null,
      status: "running"
    });

    // Build workflow graph
    const chain = await buildWorkflowChain(workflowId);

    // Execute workflow
    const context: ExecutionContext = {
      lastOutput: undefined,
      runId,
      workflowId,
    };

    await executeWorkflow(job, chain, context);

    await prisma.run_log.update({
      where: { id: runId },
      data: {
        status: "completed",
        finished_at: new Date(),
      },
    });

    job.reportProgress({
      currentNodeId: null,
      status: "completed"
    });

    return { success: true, runId, error: null };
  } catch (error) {
    await prisma.run_log.update({
      where: { id: runId },
      data: {
        status: "failed",
        finished_at: new Date(),
        error: (error as Error).message,
      },
    });

    job.reportProgress({
      currentNodeId: null,
      status: "failed",
      error: (error as Error).message
    });

    return { success: false, runId, error: (error as Error).message };
  }
}
