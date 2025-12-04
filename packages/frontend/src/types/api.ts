// Backend API types matching Prisma schema

export type ModelType = 'gemini' | 'chatgpt' | 'claude';

export type ExecutionStatusType = 'pending' | 'running' | 'completed' | 'failed';

export type WorkflowStatus = "idle" | "running" | "completed" | "failed";

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

export type WorkflowNodeType = 'text_input' | 'agent';

export interface WorkflowNode {
  id: string;
  workflow_id?: string | null;
  type: WorkflowNodeType;
  config?: Record<string, unknown> | null;
}

export interface WorkflowNodeCreate {
  workflow_id: string;
  type: WorkflowNodeType;
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
  status: string;
}

export interface APIError {
  message?: string;
  error?: string;
  errors?: unknown;
}
