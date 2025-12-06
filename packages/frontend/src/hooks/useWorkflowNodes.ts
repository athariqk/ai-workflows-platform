import { useState, useEffect, useCallback } from "react";
import {
  applyNodeChanges,
  getIncomers,
  getOutgoers,
  getConnectedEdges,
  type Node,
  type NodeChange,
  type Edge,
} from "@xyflow/react";
import { updateNodePosition } from "@/utils/workflowTransformers";
import { api } from "@/lib/api";
import { transformNodesToReactFlow } from "@/utils/workflowTransformers";

export function useWorkflowNodes(
  workflowId: string | undefined,
  edges: Edge[],
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
  markEdgesAsCascadeDeleted: (edgeIds: string[]) => void
) {
  const [nodes, setNodes] = useState<Node[]>([]);

  // Fetch and rebuild workflow nodes
  useEffect(() => {
    if (workflowId) {
      api
        .getWorkflowNodes()
        .then((allNodes) => {
          const workflowNodes = allNodes.filter((node) => node.workflow_id === workflowId);
          const flowNodes = transformNodesToReactFlow(workflowNodes);
          setNodes(flowNodes);
        })
        .catch((err) => {
          console.error("Failed to load workflow nodes:", err);
        });
    }
  }, [workflowId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nodesSnapshot) => {
        const updatedNodes = applyNodeChanges(changes, nodesSnapshot);

        changes.forEach((change) => {
          if (change.type === "position" && change.position && workflowId) {
            if (change.dragging === false) {
              const node = updatedNodes.find((n) => n.id === change.id);
              if (node) {
                // Update node config with new position
                const updatedConfig = updateNodePosition(node, change.position);

                api
                  .updateWorkflowNode(change.id, {
                    config: updatedConfig,
                  })
                  .catch((err) => {
                    console.error("Failed to update node position:", err);
                  });
              }
            }
          }
        });

        return updatedNodes;
      });
    },
    [workflowId]
  );

  // From https://reactflow.dev/examples/nodes/delete-middle-node
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (!workflowId) return;

      // First, mark all connected edges as cascade-deleted BEFORE deleting nodes
      // This ensures the mark is in place when ReactFlow triggers edge removal events
      deleted.forEach((node) => {
        const connectedEdges = getConnectedEdges([node], edges);
        markEdgesAsCascadeDeleted(connectedEdges.map((edge) => edge.id));
      });

      // Delete nodes from database (cascade deletes will remove edges)
      deleted.forEach((node) => {
        api.deleteWorkflowNode(node.id).catch((err) => {
          console.error(`Failed to delete workflow node ${node.id}:`, err);
        });
      });

      let remainingNodes = [...nodes];
      const newEdges = deleted.reduce((acc, nodeToDelete) => {
        const incomers = getIncomers(nodeToDelete, remainingNodes, acc);
        const outgoers = getOutgoers(nodeToDelete, remainingNodes, acc);
        const connectedEdges = getConnectedEdges([nodeToDelete], acc);

        const remainingEdges = acc.filter((edge) => !connectedEdges.includes(edge));

        // Create reconnection edges in the database
        incomers.forEach(({ id: source }) => {
          outgoers.forEach(({ id: target }) => {
            api
              .createWorkflowEdge({
                workflow_id: workflowId,
                source_node_id: source,
                target_node_id: target,
              })
              .then((createdEdge) => {
                setEdges((currentEdges) => [
                  ...currentEdges,
                  {
                    id: createdEdge.id,
                    source,
                    target,
                  },
                ]);
              })
              .catch((err) => {
                console.error("Failed to create reconnection edge:", err);
              });
          });
        });

        remainingNodes = remainingNodes.filter((rn) => rn.id !== nodeToDelete.id);

        return remainingEdges;
      }, edges);

      setEdges(newEdges);
    },
    [nodes, edges, setEdges, workflowId, markEdgesAsCascadeDeleted]
  );

  return {
    nodes,
    setNodes,
    onNodesChange,
    onNodesDelete,
  };
}
