import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { Workflow, WorkflowRun, WorkflowStatus } from "@/types/api";

interface WorkflowHeaderProps {
  workflow: Workflow | null;
  loading: boolean;
  error: string | null;
  currentRun: WorkflowRun | null;
  workflowStatus?: WorkflowStatus;
  workflowError: string | null;
}

export function WorkflowHeader({
  workflow,
  loading,
  error,
  currentRun,
  workflowStatus,
  workflowError,
}: WorkflowHeaderProps) {
  const getStatusIndicator = () => {
    if (!currentRun) return null;

    switch (workflowStatus) {
      case "completed":
        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={20} />
            <span className="text-sm font-medium">Completed</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-2 text-red-600">
            <XCircle size={20} />
            <span className="text-sm font-medium">Failed</span>
          </div>
        );
      case "running":
        return (
          <div className="flex items-center gap-2 text-indigo-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Running</span>
          </div>
        );
    }

    return null;
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 min-h-[68px] flex flex-col justify-center shrink-0 py-4">
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 size={20} className="animate-spin text-indigo-600" />
          <span className="text-slate-600">Loading workflow...</span>
        </div>
      ) : error ? (
        <div className="text-red-600">
          <strong>Error:</strong> {error}
        </div>
      ) : workflow ? (
        <>
          <div className="flex flex-row items-center gap-4">
            <h2 className="text-2xl font-medium text-slate-800">{workflow.name}</h2>
            {getStatusIndicator()}
          </div>
          {workflowError && workflowStatus === "failed" && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <strong className="font-semibold">Workflow Error:</strong> {workflowError}
            </div>
          )}
        </>
      ) : (
        <div>
          <h2 className="text-2xl font-medium text-slate-800">Workflow Builder</h2>
          <p className="text-sm text-slate-500 mt-1">Select a workflow to edit</p>
        </div>
      )}
    </header>
  );
}
