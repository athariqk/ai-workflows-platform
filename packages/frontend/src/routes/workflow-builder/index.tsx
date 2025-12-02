import { createFileRoute } from "@tanstack/react-router";
import { Activity, Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Workflow } from "@/types/api";
import { Link } from "@tanstack/react-router";

interface WorkflowBuilderSearch {
  workflowId?: string;
}

export const Route = createFileRoute("/workflow-builder/")({
  component: EditorComponent,
  validateSearch: (search: Record<string, unknown>): WorkflowBuilderSearch => {
    return {
      workflowId: (search.workflowId as string) || undefined,
    };
  },
});

function EditorComponent() {
  const { workflowId } = Route.useSearch();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (workflowId) {
      setLoading(true);
      setError(null);
      api
        .getWorkflow(workflowId)
        .then((data) => {
          setWorkflow(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [workflowId]);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <Activity size={24} /> AWP
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            to="/dashboard/workflows"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Workflows
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200"></div>
            <div>
              <p className="text-sm font-medium">Ahmad</p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Workflow Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin text-indigo-600" />
              <span className="text-slate-600">Loading workflow...</span>
            </div>
          ) : error ? (
            <div className="text-red-600">
              <strong>Error:</strong> {error}
            </div>
          ) : workflow ? (
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{workflow.name}</h2>
              {workflow.description && (
                <p className="text-sm text-slate-500 mt-1">{workflow.description}</p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Workflow Builder</h2>
              <p className="text-sm text-slate-500 mt-1">Select a workflow to edit</p>
            </div>
          )}
        </div>

        <div className="flex gap-8 p-8">
          {/* Left: Configuration */}
          <div className="w-2/3 space-y-6">
            {/* Visual Chain Builder */}
            </div>
        </div>
      </div>
    </div>
  );
}
