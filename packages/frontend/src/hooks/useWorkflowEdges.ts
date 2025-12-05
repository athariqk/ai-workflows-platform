import { useState, useEffect, useCallback, useRef } from "react";
import {
  applyEdgeChanges,
  addEdge,
  type Edge,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { api } from "@/lib/api";
import { transformEdgesToReactFlow } from "@/utils/workflowTransformers";

export function useWorkflowEdges(workflowId: string | undefined) {
  const [edges, setEdges] = useState<Edge[]>([]);
  // Track edge IDs that were cascade-deleted (don't try to delete from API)
  const cascadeDeletedEdgeIds = useRef<Set<string>>(new Set());

  // Fetch and rebuild workflow edges
  useEffect(() => {
    if (workflowId) {
      api
        .getWorkflowEdges()
        .then((allEdges) => {
          const workflowEdges = allEdges.filter(
            (edge) => edge.workflow_id === workflowId
          );
          const flowEdges = transformEdgesToReactFlow(workflowEdges);
          setEdges(flowEdges);
        })
        .catch((err) => {
          console.error("Failed to load workflow edges:", err);
        });
    }
  }, [workflowId]);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((edgesSnapshot) => {
        const updatedEdges = applyEdgeChanges(changes, edgesSnapshot);

        changes.forEach((change) => {
          if (change.type === "remove" && workflowId) {
            // Skip API call if edge was cascade-deleted
            if (cascadeDeletedEdgeIds.current.has(change.id)) {
              cascadeDeletedEdgeIds.current.delete(change.id);
              return;
            }
            
            api.deleteWorkflowEdge(change.id).catch((err) => {
              console.error("Failed to delete workflow edge:", err);
            });
          }
        });

        return updatedEdges;
      });
    },
    [workflowId]
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (!workflowId) return;
      if (!params.source || !params.target) return;

      setEdges((edgesSnapshot) => {
        // Remove old edge from source (enforce single outgoing edge)
        const oldEdge = edgesSnapshot.find(
          (edge) => edge.source === params.source
        );
        if (oldEdge) {
          api.deleteWorkflowEdge(oldEdge.id).catch((err) => {
            console.error("Failed to delete old workflow edge:", err);
          });
        }

        const filteredEdges = edgesSnapshot.filter(
          (edge) => edge.source !== params.source
        );

        api
          .createWorkflowEdge({
            workflow_id: workflowId,
            source_node_id: params.source as string,
            target_node_id: params.target as string,
          })
          .then((createdEdge) => {
            setEdges((currentEdges) => {
              const edgeWithDbId = {
                id: createdEdge.id,
                source: params.source as string,
                target: params.target as string,
              };
              return addEdge(edgeWithDbId, currentEdges);
            });
          })
          .catch((err) => {
            console.error("Failed to create workflow edge:", err);
          });

        return filteredEdges;
      });
    },
    [workflowId]
  );

  // Mark edges as cascade-deleted so onEdgesChange won't try to delete them via API
  const markEdgesAsCascadeDeleted = useCallback((edgeIds: string[]) => {
    edgeIds.forEach(id => cascadeDeletedEdgeIds.current.add(id));
  }, []);

  return {
    edges,
    setEdges,
    onEdgesChange,
    onConnect,
    markEdgesAsCascadeDeleted,
  };
}
