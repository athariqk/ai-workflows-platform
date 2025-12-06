import { prisma } from "@/lib/prisma.js";
import uuidv7 from "@/lib/uuid-v7.js";
import type { WorkflowJobData } from "@/lib/types.js";
import AgentStep from "@/workflow-runner/steps/agent-step.js";
import Step, { StepType } from "./steps/step.js";
import { Job } from "bee-queue";
import TextInputStep from "./steps/text-input-step.js";
import { WorkflowProgress } from "@/lib/types.js";
import { reportProgress } from "./utils.js";

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

  const chain: WorkflowChain = { data: [] };
  let currentNode = startNodes[0];
  while (currentNode) {
    let step: Step;

    const config = currentNode.config as Record<string, unknown> | null;
    if (!config) continue;

    //  config structure:
    //  {
    //    type: StepType
    //    ...the rest of the config specific to the step type
    //  }
    const type = config.type as StepType | null;
    if (!type) {
      throw new Error(`Node ${currentNode.id} is missing type in config`);
    }

    switch (type) {
      case "agent": {
        const agent = config.agent as { id: string } | null;
        if (!agent?.id) {
          throw new Error(`Agent node ${currentNode.id} is missing a config`);
        }
        step = new AgentStep(agent.id);
        break;
      }
      case "text_input": {
        const value = config.value as string | null;
        step = new TextInputStep(value || "");
        break;
      }
      default:
        throw new Error(`Unsupported node type in workflow chain: ${type}`);
    }

    await step.initialize();

    chain.data.push({
      id: currentNode.id,
      step,
    });

    const nextId = nodeMap.get(currentNode.id);
    currentNode = nextId ? nodes.find((n: { id: string }) => n.id === nextId) : undefined;
  }

  return chain;
}

/**
 * Execute workflow linearly step by step
 */
async function executeWorkflow(
  job: Job<WorkflowJobData>,
  chain: WorkflowChain,
  context: ExecutionContext
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
          name: currentNode.step.name,
          input: stepInput,
          node_id: currentNode.id,
          started_at: new Date(),
          status: "running",
        },
      });

      reportProgress(job, "workflow_progress", {
        workflowId: context.workflowId,
        currentStep: {
          nodeId: currentNode.id,
          name: currentNode.step.name,
          status: "running",
        },
      } as WorkflowProgress);

      // Execute the step
      const output = await currentNode.step.execute(stepInput);

      // Store output in context
      context.lastOutput = output;

      // Update step log with success
      await prisma.step_log.update({
        where: { id: stepLogId },
        data: {
          finished_at: new Date(),
          output: output,
          status: "completed",
        },
      });

      reportProgress(job, "workflow_progress", {
        workflowId: context.workflowId,
        currentStep: {
          nodeId: currentNode.id,
          name: currentNode.step.name,
          status: "completed",
          output: output,
        },
      } as WorkflowProgress);
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

      reportProgress(job, "workflow_progress", {
        currentStep: {
          nodeId: currentNode.id,
          name: currentNode.step.name,
          status: "failed",
          error: (error as Error).message,
        },
      } as WorkflowProgress);
      throw error;
    }
  }
}

/**
 * Main workflow execution handler
 */
export async function executeWorkflowJob(
  job: Job<WorkflowJobData>
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

    reportProgress(job, "workflow_progress", {
      workflowId: workflowId,
      status: "running",
    } as WorkflowProgress);

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

    reportProgress(job, "workflow_progress", {
      workflowId: workflowId,
      status: "completed",
    } as WorkflowProgress);

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

    reportProgress(job, "workflow_progress", {
      workflowId: workflowId,
      status: "failed",
      error: (error as Error).message
    } as WorkflowProgress);

    return { success: false, runId, error: (error as Error).message };
  }
}
