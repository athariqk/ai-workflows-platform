import { Handle, Position } from "@xyflow/react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export type NodeStatus = "idle" | "running" | "completed" | "failed";

interface WorkflowNodeProps {
  children: React.ReactNode;
  status?: NodeStatus;
}

export default function WorkflowNode({ children, status }: WorkflowNodeProps) {
  const currentStatus = status || "idle";

  const statusColors: Record<NodeStatus, string> = {
    idle: "border-slate-200",
    running: "border-blue-400 bg-blue-50",
    completed: "border-green-400 bg-green-50",
    failed: "border-red-400 bg-red-50",
  };

  const StatusIcon = () => {
    switch (currentStatus) {
      case "running":
        return <Loader2 size={24} className="text-blue-600 animate-spin" />;
      case "completed":
        return <CheckCircle2 size={24} className="text-green-600" />;
      case "failed":
        return <XCircle size={24} className="text-red-600" />;
      default:
        return null;
    }
  };

  const handleStyle = {
    width: "16px",
    height: "16px",
    border: "2px solid #3b82f6",
    backgroundColor: "white",
  };

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-white border-2 max-w-[300px] hover:border-blue-600 focus:border-blue-600 transition-colors relative ${statusColors[currentStatus]}`}
    >
      {currentStatus !== "idle" && (
        <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
          <StatusIcon />
        </div>
      )}
      <Handle type="source" position={Position.Right} style={handleStyle} />
      {children}
      <Handle type="target" position={Position.Left} style={handleStyle} />
    </div>
  );
}
