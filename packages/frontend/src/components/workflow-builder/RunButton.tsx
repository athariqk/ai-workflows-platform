import { Play, Loader2 } from "lucide-react";
import type { WorkflowRun, WorkflowStatus } from "@/types/api";

interface RunButtonProps {
  workflowId: string | undefined;
  currentRun: WorkflowRun | null;
  workflowStatus: WorkflowStatus;
  handleRun?: () => void;
}

export function RunButton({ workflowId, currentRun, workflowStatus, handleRun }: RunButtonProps) {
  const isRunning = !!currentRun && workflowStatus === "running";

  return (
    <button
      onClick={handleRun}
      className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center group cursor-pointer active:scale-90 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      title={isRunning ? "Workflow Running..." : "Run Workflow"}
      disabled={!workflowId || isRunning}
    >
      {isRunning ? (
        <Loader2 size={24} className="animate-spin" />
      ) : (
        <Play size={24} className="fill-current" />
      )}
    </button>
  );
}
