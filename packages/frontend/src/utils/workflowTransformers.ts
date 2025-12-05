import type { Node, Edge } from "@xyflow/react";
import type { Agent, WorkflowEdge, WorkflowNode, StepType } from "@/types/api";

interface NodeTypeConfig {
  reactFlowType: string;
  createReactFlowNode: (node: WorkflowNode) => Node;
  createConfig: (
    data: Record<string, unknown>,
    position: { x: number; y: number }
  ) => Record<string, unknown>;
}

/**
 * Maps DB types to ReactFlow types and handles transformations
*/
const nodeTypeRegistry: Record<StepType, NodeTypeConfig> = {
  agent: {
    reactFlowType: "agentNode",
    createReactFlowNode: (node) => {
      const config = node.config as {
        agent?: Agent;
        position?: { x: number; y: number };
        type?: StepType;
      } | null;
      const data = node.config ?? {
        type: "agent",
        name: "Unnamed Agent",
        position: { x: 0, y: 0 },
      };
      return {
        id: node.id,
        type: "agentNode",
        position: config?.position || { x: 0, y: 0 },
        data: {
          ...data,
          name: data.name ?? "Unnamed Agent",
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
        type?: StepType;
      } | null;
      const data = node.config ?? {
        type: "text_input",
        name: "Text Input",
        position: { x: 0, y: 0 },
      };
      return {
        id: node.id,
        type: "textInputNode",
        position: config?.position || { x: 0, y: 0 },
        data: {
          ...data,
          name: data.label || "Text Input",
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
    const stepType = (node.config as { type?: StepType } | null)?.type;
    if (!stepType) {
      console.error(`Node ${node.id} is missing type in config or config is null`);
      return {
        id: node.id,
        type: "default",
        position: { x: 0, y: 0 },
        data: { label: "Unknown Node" },
      };
    }
    const config = nodeTypeRegistry[stepType];
    if (!config) {
      console.error(`Unknown node/step type: ${stepType}`);
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
  data: Record<string, unknown>,
  position: { x: number; y: number }
): Record<string, unknown> {
  const stepType = (data as { type?: StepType })?.type;
  if (!stepType) {
    console.error(`Node/step type is missing in data`);
    return {
      position: { x: 0, y: 0 },
      data: { type: "unknown", label: "Unknown Node" },
    };
  }
  const config = nodeTypeRegistry[stepType];
  if (!config) {
    throw new Error(`Unknown node/step type: ${stepType}`);
  }
  return {
    ...config.createConfig(data, position),
  };
}

export function getReactFlowNodeType(stepType: StepType): string {
  const config = nodeTypeRegistry[stepType];
  if (!config) {
    console.error(`Unknown node/step type: ${stepType}`);
    return "default";
  }
  return config.reactFlowType;
}

export function updateNodePosition(
  node: Node,
  position: { x: number; y: number }
): Record<string, unknown> {
  // node.data contains the full config, just update position
  return {
    ...node.data,
    position,
  };
}
