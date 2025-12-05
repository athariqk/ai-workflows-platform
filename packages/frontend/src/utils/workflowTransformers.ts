import type { Node, Edge } from "@xyflow/react";
import type { Agent, WorkflowEdge, WorkflowNode, WorkflowNodeType } from "@/types/api";

// Node type registry - maps DB types to ReactFlow types and handles transformations
interface NodeTypeConfig {
  reactFlowType: string;
  createReactFlowNode: (node: WorkflowNode) => Node;
  createConfig: (data: Record<string, unknown>, position: { x: number; y: number }) => Record<string, unknown>;
}

const nodeTypeRegistry: Record<WorkflowNodeType, NodeTypeConfig> = {
  agent: {
    reactFlowType: "agentNode",
    createReactFlowNode: (node) => {
      const config = node.config as {
        agent?: Agent;
        position?: { x: number; y: number };
      } | null;

      return {
        id: node.id,
        type: "agentNode",
        position: config?.position || { x: 0, y: 0 },
        data: {
          agent: config?.agent || {
            id: "unknown",
            name: "Unknown Agent",
            model: "gemini_2_5_flash" as const,
            system_prompt: null,
            temperature: null,
          },
          label: config?.agent?.name || "Unknown Agent",
        },
      };
    },
    createConfig: (data, position) => {
      return {
        ...data,
        position,
      };
    },
  },
  text_input: {
    reactFlowType: "textInputNode",
    createReactFlowNode: (node) => {
      const config = node.config as {
        position?: { x: number; y: number };
        label?: string;
        placeholder?: string;
        value?: string;
      } | null;
      return {
        id: node.id,
        type: "textInputNode",
        position: config?.position || { x: 0, y: 0 },
        data: {
          label: config?.label || "Text Input",
          placeholder: config?.placeholder || "Enter text...",
          value: config?.value || "",
        },
      };
    },
    createConfig: (data, position) => {
      return {
        ...data,
        position,
      };
    },
  },
};

export function transformNodesToReactFlow(
  nodes: WorkflowNode[],
): Node[] {
  return nodes.map((node) => {
    const config = nodeTypeRegistry[node.type];
    if (!config) {
      console.error(`Unknown node type: ${node.type}`);
      return {
        id: node.id,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: "Unknown Node" },
      };
    }
    return config.createReactFlowNode(node);
  });
}

export function transformEdgesToReactFlow(edges: WorkflowEdge[]): Edge[] {
  return edges
    .filter((edge) => edge.source_node_id && edge.target_node_id)
    .map((edge) => ({
      id: edge.id,
      source: edge.source_node_id as string,
      target: edge.target_node_id as string,
    }));
}

export function createNodeConfig(
  nodeType: WorkflowNodeType,
  data: Record<string, unknown>,
  position: { x: number; y: number }
): Record<string, unknown> {
  const config = nodeTypeRegistry[nodeType];
  if (!config) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }
  return config.createConfig(data, position);
}

export function getReactFlowNodeType(dbNodeType: WorkflowNodeType): string {
  const config = nodeTypeRegistry[dbNodeType];
  if (!config) {
    console.error(`Unknown node type: ${dbNodeType}`);
    return "default";
  }
  return config.reactFlowType;
}

export function updateNodePosition(
  node: Node,
  position: { x: number; y: number }
): Record<string, unknown> {
  // Merge existing data with new position
  return {
    ...node.data,
    position,
  };
}
