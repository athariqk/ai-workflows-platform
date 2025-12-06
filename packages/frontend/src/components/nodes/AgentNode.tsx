import type { NodeProps } from "@xyflow/react";
import { type Node } from "@xyflow/react";
import { Bot } from "lucide-react";
import type { Agent, ModelType } from "@/types/api";
import WorkflowNode from "./WorkflowNode";

export type NodeStatus = "idle" | "running" | "completed" | "failed";

export type AgentNodeData = Node<{
  agent?: Agent;
  label?: string;
  status?: NodeStatus;
  [key: string]: unknown; // Allow any config fields
}>;

export default function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const modelColors: Record<ModelType, string> = {
    gemini_2_5_flash: "bg-blue-500",
    gpt_5_mini: "bg-green-500",
    claude_sonnet_4_5: "bg-purple-500",
  };

  // Extract agent from data (full config)
  const agent = data.agent;

  if (!agent) {
    return (
      <WorkflowNode status={data.status}>
        <div className="text-sm text-slate-500">No agent configured</div>
      </WorkflowNode>
    );
  }

  return (
    <WorkflowNode status={data.status}>
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded ${modelColors[agent.model]} text-white`}>
          <Bot size={16} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800">{agent.name}</div>
          <div className="text-xs text-slate-500 capitalize">{agent.model}</div>
        </div>
      </div>

      {agent.system_prompt && <div className="mt-2 text-xs text-slate-600 line-clamp-2">{agent.system_prompt}</div>}
    </WorkflowNode>
  );
}
