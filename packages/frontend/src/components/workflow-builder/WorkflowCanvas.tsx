import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import AgentNode from "@/components/nodes/AgentNode";
import TextInputNode from "@/components/nodes/TextInputNode";
import NodePropertiesPanel from "./NodePropertiesPanel";
import ContextMenu from "./ContextMenu";
import { api } from "@/lib/api";

const nodeTypes = {
  agentNode: AgentNode,
  textInputNode: TextInputNode,
};

interface ContextMenuState {
  id: string;
  top?: number | false;
  left?: number | false;
  right?: number;
  bottom?: number;
}

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onNodesDelete: (deleted: Node[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: Edge | Connection) => void;
  onDrop: (event: DragEvent) => void;
  onDragOver: (event: DragEvent) => void;
  workflowId?: string;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onNodesDelete,
  onEdgesChange,
  onConnect,
  onDrop,
  onDragOver,
  workflowId,
}: WorkflowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (nodeToDelete) {
        onNodesDelete([nodeToDelete]);
        onNodesChange([{ type: 'remove', id: nodeId }]);
      }
      setMenu(null);
      setSelectedNode(null);
    },
    [nodes, onNodesDelete, onNodesChange]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, updates: Record<string, unknown>) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      // Update node data in local state
      onNodesChange([
        {
          type: "replace",
          id: nodeId,
          item: {
            ...node,
            data: { ...node.data, ...updates },
          },
        },
      ]);

      if (workflowId) {
        // Preserve entire config and merge with updates
        const updatedConfig = {
          ...node.data,
          ...updates,
        };

        // Send away!!
        api
          .updateWorkflowNode(nodeId, { config: updatedConfig })
          .catch((err) => {
            console.error("Failed to update node:", err);
          });
      }
    },
    [nodes, onNodesChange, workflowId]
  );

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    // Close the context menu if it's open whenever the window is clicked.
    setMenu(null);
  }, [setMenu, setSelectedNode]);

  // From https://reactflow.dev/examples/interaction/context-menu
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent<Element, MouseEvent>, node: Node) => {
      // Prevent native context menu from showing
      event.preventDefault();

      // Calculate position of the context menu. We want to make sure it
      // doesn't get positioned off-screen.
      if (!ref.current) return;
      const pane = ref.current.getBoundingClientRect();

      // Calculate position relative to the pane
      const relativeY = event.clientY - pane.top;
      const relativeX = event.clientX - pane.left;

      setMenu({
        id: node.id,
        top: relativeY < pane.height - 200 ? relativeY : undefined,
        left: relativeX < pane.width - 200 ? relativeX : undefined,
        right:
          relativeX >= pane.width - 200 ? pane.width - relativeX : undefined,
        bottom:
          relativeY >= pane.height - 200 ? pane.height - relativeY : undefined,
      });
    },
    [setMenu]
  );

  return (
    <main ref={reactFlowWrapper} className="flex-1 overflow-hidden relative">
      <ReactFlow
        ref={ref}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodesDelete={onNodesDelete}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
        }}
        fitView
      >
        <Background />
        <Controls />
        {menu && (
          <ContextMenu
            onClick={onPaneClick}
            id={menu.id}
            top={menu.top !== false ? menu.top : undefined}
            left={menu.left !== false ? menu.left : undefined}
            right={menu.right}
            bottom={menu.bottom}
            onNodeDelete={handleNodeDelete}
          />
        )}
      </ReactFlow>
      {!selectedNode && nodes.length > 0 && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-4 py-2 shadow-sm text-sm text-slate-600 pointer-events-none">
          💡 Click a node to view its properties
        </div>
      )}
      <NodePropertiesPanel
        selectedNode={selectedNode}
        onClose={() => setSelectedNode(null)}
        onUpdateNode={handleUpdateNode}
      />
    </main>
  );
}
