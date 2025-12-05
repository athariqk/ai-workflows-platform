export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'canceled';

export type JobProgressType = 'workflow_progress';

export interface JobProgress {
  type: JobProgressType;
  data: unknown;
}

export interface WorkflowJobData {
  workflowId: string;
  runId: string;
}

export interface WorkflowStepProgress {
    id: string;
    name: string;
    status: WorkflowStatus;
    output?: string;
    error?: string;
}

export interface WorkflowProgress {
    workflowId: string;
    status: WorkflowStatus;
    // If currentStep is undefined, it means the progress is for the overall workflow
    currentStep?: WorkflowStepProgress;
    error?: string;
}
