import type { NodeProps } from "@xyflow/react";
import { type Node } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { Agent, ModelType } from "@/types/api";
import WorkflowNode from "./WorkflowNode";

export type NodeStatus = "idle" | "running" | "completed" | "failed";

export type AgentNodeData = Node<{
  agent: Agent;
  label: string;
  status?: NodeStatus;
}>

export default function AgentNode({ data }: NodeProps<AgentNodeData>) {  
  const modelColors: Record<ModelType, string> = {
    gemini: "bg-blue-500",
    chatgpt: "bg-green-500",
    claude: "bg-purple-500",
  };

  return (
    <WorkflowNode status={data.status}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded ${modelColors[data.agent.model]} text-white`}>
          <Bot size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">{data.agent.name}</div>
          <div className="text-xs text-slate-500 capitalize">{data.agent.model}</div>
        </div>
      </div>
      
      {data.agent.system_prompt && (
        <div className="mt-2 text-xs text-slate-600 line-clamp-2">
          {data.agent.system_prompt}
        </div>
      )}
    </WorkflowNode>
  );
}
