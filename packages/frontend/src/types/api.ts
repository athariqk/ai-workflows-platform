// Backend API types matching Prisma schema

export type StepType = "text_input" | "agent";

export type ModelType = "gemini_2_5_flash" | "gpt_5_mini" | "claude_sonnet_4_5";

export type WorkflowStatus = "idle" | "pending" | "running" | "completed" | "failed";

export interface Agent {
  id: string;
  name: string;
  model: ModelType;
  system_prompt: string | null;
  temperature: number | null;
}

export interface AgentCreate {
  name: string;
  model: ModelType;
  system_prompt?: string | null;
  temperature?: number | null;
}

export interface AgentUpdate {
  name?: string;
  model?: ModelType;
  system_prompt?: string | null;
  temperature?: number | null;
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
}

export interface WorkflowCreate {
  name: string;
  description?: string | null;
}

export interface WorkflowUpdate {
  name?: string;
  description?: string | null;
}

export interface WorkflowNode {
  id: string;
  workflow_id?: string | null;
  config?: Record<string, unknown> | null;
}

export interface WorkflowNodeCreate {
  workflow_id: string;
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  workflow_id: string;
  source_node_id: string | null;
  target_node_id: string | null;
}

export interface WorkflowEdgeCreate {
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
}

export interface WorkflowRun {
  run_id: string;
  job_id: string;
  status: WorkflowStatus;
}

export interface WorkflowStepProgress {
  nodeId: string;
  name: string;
  status: WorkflowStatus;
  output?: string;
  error?: string;
}

export interface WorkflowProgress {
  workflowId: string;
  runStatus: WorkflowRun;
  // If currentStep is undefined, it means the progress is for the overall workflow
  currentStep?: WorkflowStepProgress;
  error?: string;
}

export interface StepLog {
  id: string;
  run_id: string;
  node_id?: string;
  name: string;
  input?: string;
  output?: string;
  status?: WorkflowStatus;
  started_at?: string;
  finished_at?: string;
  error?: string;
}

export interface RunLog {
  id: string;
  workflow_id?: string;
  job_id?: string;
  status?: WorkflowStatus;
  started_at?: string;
  finished_at?: string;
  error?: string;
  workflow?: {
    id: string;
    name: string;
    description?: string;
  };
  step_log: StepLog[];
}

export interface RunLogsQueryParams {
  workflow_id?: string;
  status?: WorkflowStatus;
}

export interface APIError {
  message?: string;
  error?: string;
  errors?: unknown;
}
