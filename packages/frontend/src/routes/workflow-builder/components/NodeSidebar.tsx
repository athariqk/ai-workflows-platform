import { useState, type DragEvent } from "react";
import { Loader2, Bot, Search, Type, Box } from "lucide-react";
import type { Agent, WorkflowNodeType } from "@/types/api";
import type { LucideIcon } from "lucide-react";

interface NodeSidebarProps {
  agents: Agent[];
  agentsLoading: boolean;
  onDragStart: (
    event: DragEvent,
    dbNodeType: WorkflowNodeType,
    data: Record<string, unknown>
  ) => void;
}

// Node definition (unified structure for all node types)
interface NodeDefinition {
  id: string;
  dbNodeType: WorkflowNodeType;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  data: Record<string, unknown>;
}

export function NodeSidebar({
  agents,
  agentsLoading,
  onDragStart,
}: NodeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const agentNodes: NodeDefinition[] = agents.map((agent) => ({
    id: agent.id,
    dbNodeType: "agent" as const,
    name: agent.name,
    description: agent.model,
    icon: Bot,
    color: "text-indigo-600",
    data: {
      agent: { ...agent },
    },
  }));

  const utilityNodes: NodeDefinition[] = [
    {
      id: "text-input",
      dbNodeType: "text_input" as const,
      name: "Text Input",
      description: "Manual text input",
      icon: Type,
      color: "text-emerald-600",
      data: {
        label: "Text Input",
        placeholder: "Enter text...",
      },
    },
    // other utitility nodes go here
  ];

  const allNodes = [...agentNodes, ...utilityNodes];

  const filteredNodes = allNodes.filter(
    (node) =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border-slate-200 flex flex-col">
      {/* Header */}
      <div className="py-2 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Box size={16} />
          Node Selector
        </h3>

        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {agentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-indigo-600" />
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            {searchQuery ? "No nodes found" : "No nodes available"}
          </div>
        ) : (
          filteredNodes.map((node) => {
            const Icon = node.icon;
            return (
              <div
                key={node.id}
                draggable
                onDragStart={(e) => onDragStart(e, node.dbNodeType, node.data)}
                className="p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-move hover:bg-slate-100 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={node.color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {node.name}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {node.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Hint */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <p className="text-xs text-slate-600">
          💡 Drag and drop nodes onto the canvas to build your workflow
        </p>
      </div>
    </div>
  );
}
