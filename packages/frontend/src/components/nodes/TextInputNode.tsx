import type { NodeProps, Node } from "@xyflow/react";
import WorkflowNode, { type NodeStatus } from "./WorkflowNode";
import { Text } from "lucide-react";

export type TextInputNodeData = Node<{
  label?: string;
  placeholder?: string;
  value?: string;
  status?: NodeStatus;
  [key: string]: unknown; // Allow any config fields
}>;

export default function TextInputNode({ data }: NodeProps<TextInputNodeData>) {
  return (
    <WorkflowNode status={data.status}>
      <div className="flex items-center gap-2">
        <div className="p-2 rounded">
          <Text size={16} />
        </div>
        <h1 className="text-sm font-semibold text-slate-800">{data.label || "Text Input"}</h1>
      </div>
      <p className="w-30 h-full text-wrap truncate mt-2 text-xs text-slate-600 line-clamp-2">
        {data.value || data.placeholder || ""}
      </p>
    </WorkflowNode>
  );
}
