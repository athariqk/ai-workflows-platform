import { useCallback, type DragEvent } from "react";
import { useReactFlow, type Node, type Edge } from "@xyflow/react";
import { api } from "@/lib/api";
import type { WorkflowNodeType } from "@/types/api";
import { createNodeConfig, getReactFlowNodeType } from "../routes/workflow-builder/utils/workflowTransformers";

export interface DraggableNodeData {
  dbNodeType: WorkflowNodeType;
  reactFlowNodeType: string;
  data: Record<string, unknown>;
}

export function useReactFlowHandlers(
  workflowId: string | undefined,
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>
) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!workflowId) {
        console.error("No workflow selected");
        return;
      }

      const transferData = event.dataTransfer.getData("application/reactflow");
      if (!transferData) return;

      const draggableData: DraggableNodeData = JSON.parse(transferData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeConfig = createNodeConfig(
        draggableData.dbNodeType,
        draggableData.data,
        position
      );

      api
        .createWorkflowNode({
          workflow_id: workflowId,
          type: draggableData.dbNodeType,
          config: nodeConfig,
        })
        .then((nodeInDb) => {
          setNodes((nodes) => {
            const newNode: Node = {
              id: nodeInDb.id,
              type: draggableData.reactFlowNodeType,
              position,
              data: draggableData.data,
            };
            const newNodes = nodes.concat(newNode);
            return newNodes;
          });
        })
        .catch((err) => {
          console.error("Failed to create workflow node:", err);
        });
    },
    [screenToFlowPosition, workflowId, setNodes, setEdges]
  );

  const onDragStart = useCallback(
    (event: DragEvent, dbNodeType: WorkflowNodeType, data: Record<string, unknown>) => {
      const reactFlowNodeType = getReactFlowNodeType(dbNodeType);
      const draggableData: DraggableNodeData = {
        dbNodeType,
        reactFlowNodeType,
        data,
      };
      event.dataTransfer.setData("application/reactflow", JSON.stringify(draggableData));
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return {
    onDragOver,
    onDrop,
    onDragStart,
  };
}
