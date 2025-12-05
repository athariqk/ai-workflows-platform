import { useState } from "react";
import { X, FileText, Edit3, Save, XCircle, Type } from "lucide-react";
import type { Node } from "@xyflow/react";

interface NodePropertiesPanelProps {
  selectedNode: Node | null;
  onClose: () => void;
  onUpdateNode?: (nodeId: string, updates: Record<string, unknown>) => void;
}

export default function NodePropertiesPanel({
  selectedNode,
  onClose,
  onUpdateNode,
}: NodePropertiesPanelProps) {
  if (!selectedNode) return null;

  const output = (selectedNode.data as { output?: string }).output;
  const status = (selectedNode.data as { status?: string }).status;
  const error = (selectedNode.data as { error?: string }).error;
  const isTextInputNode = selectedNode.type === "textInputNode";

  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(
    (selectedNode.data as { value?: string }).value || ""
  );

  const handleSave = () => {
    if (onUpdateNode) {
      onUpdateNode(selectedNode.id, { value: editedValue });
    }
    setIsEditing(false);
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">
          Node Properties
        </h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {/* Node Info */}
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">
            Node
          </h4>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-sm font-medium text-slate-800">
              {(selectedNode.data as { label?: string }).label ||
                "Untitled Node"}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Type: {selectedNode.type || "unknown"}
            </div>
            {status && (
              <div className="text-xs text-slate-500 mt-1">
                Status: <span className="capitalize font-medium">{status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Input Node Editor */}
        {isTextInputNode && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-slate-500 uppercase flex items-center gap-1">
                <Type size={12} />
                Content
              </h4>
              {isEditing ? (
                <button
                  onClick={handleSave}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Save size={12} />
                  Save
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} />
                  Edit
                </button>
              )}
            </div>
            <textarea
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              placeholder={
                (selectedNode.data as { placeholder?: string }).placeholder ||
                "Enter text..."
              }
              disabled={!isEditing}
              className="w-full p-3 bg-white rounded-lg border border-slate-300 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
            />
          </div>
        )}

        {/* Error */}
        {error && status === "failed" && (
          <div>
            <h4 className="text-xs font-medium text-red-500 uppercase mb-2 flex items-center gap-1">
              <XCircle size={12} />
              Error
            </h4>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          </div>
        )}

        {/* Output */}
        {output && (
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
              <FileText size={12} />
              Output
            </h4>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!output && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No output yet
          </div>
        )}
      </div>
    </div>
  );
}
