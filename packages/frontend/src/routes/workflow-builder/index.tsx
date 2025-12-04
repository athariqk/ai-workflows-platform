import { createFileRoute } from "@tanstack/react-router";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useWorkflowData } from "./hooks/useWorkflowData";
import { useWorkflowNodes } from "./hooks/useWorkflowNodes";
import { useWorkflowEdges } from "./hooks/useWorkflowEdges";
import { useWorkflowProgress } from "./hooks/useWorkflowProgress";
import { useReactFlowHandlers } from "./hooks/useReactFlowHandlers";
import { WorkflowHeader } from "./components/WorkflowHeader";
import { NodeSidebar } from "./components/NodeSidebar";
import { WorkflowCanvas } from "./components/WorkflowCanvas";
import { RunButton } from "./components/RunButton";
import { useState } from "react";
import type { WorkflowRun } from "@/types/api";
import { api } from "@/lib/api";

interface WorkflowBuilderSearch {
  workflowId?: string;
}

export const Route = createFileRoute("/workflow-builder/")({
  component: EditorComponentWrapper,
  validateSearch: (search: Record<string, unknown>): WorkflowBuilderSearch => {
    return {
      workflowId: (search.workflowId as string) || undefined,
    };
  },
});

function EditorComponentWrapper() {
  return (
    <ReactFlowProvider>
      <EditorComponent />
    </ReactFlowProvider>
  );
}

function EditorComponent() {
  const { workflowId } = Route.useSearch();

  const [currentRun, setCurrentRun] = useState<WorkflowRun | null>(null)

  // Fetch workflow and agents
  const { workflow, loading, error, agents, agentsLoading } =
    useWorkflowData(workflowId);

  // Manage edges state
  const { edges, setEdges, onEdgesChange, onConnect, markEdgesAsCascadeDeleted } =
    useWorkflowEdges(workflowId);

  // Manage nodes state (depends on edges for delete reconnection)
  const { nodes, setNodes, onNodesChange, onNodesDelete } = useWorkflowNodes(
    workflowId,
    edges,
    setEdges,
    markEdgesAsCascadeDeleted
  );

  // Track workflow progress and update node status
  const { workflowStatus } = useWorkflowProgress(currentRun, setNodes);

  // ReactFlow drag and drop handlers
  const { onDrop, onDragOver, onDragStart } = useReactFlowHandlers(
    workflowId,
    setNodes,
    setEdges
  );

  return (
    <DashboardLayout
      showBackLink
      backLinkTo="/dashboard/workflows"
      backLinkLabel="Back to Workflows"
      sidebar={
        <NodeSidebar
          agents={agents}
          agentsLoading={agentsLoading}
          onDragStart={onDragStart}
        />
      }
    >
      <div className="flex h-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <WorkflowHeader 
            workflow={workflow} 
            loading={loading} 
            error={error} 
            currentRun={currentRun}
            workflowStatus={workflowStatus}
          />
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onNodesDelete={onNodesDelete}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            workflowId={workflowId}
          />
          <RunButton
            workflowId={workflowId}
            handleRun={async () => {
              if (!workflowId) return;
              try {
                const run = await api.runWorkflow(workflowId);
                setCurrentRun(run);
              } catch (err) {
                console.error("Failed to run workflow:", err);
              }
            }}
            currentRun={currentRun}
            workflowStatus={workflowStatus}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
