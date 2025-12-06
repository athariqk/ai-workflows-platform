import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layers, Loader2, Plus, Edit, Trash2, Workflow as WorkflowIcon, PlayIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { Workflow, WorkflowStatus } from "../../types/api";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";

export const Route = createFileRoute("/dashboard/workflows")({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);

  // Track workflow run statuses
  const [workflowStatuses, setWorkflowStatuses] = useState<
    Map<
      string,
      {
        status?: WorkflowStatus;
        error?: string;
        startedAt?: string;
        finishedAt?: string;
      }
    >
  >(new Map());

  // Workflow form state
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
  });

  // Track run statuses for all workflows with real-time updates
  const { registerJob } = useWorkflowProgress(
    workflows.map((w) => w.id),
    (workflowId, progress) => {
      setWorkflowStatuses((prev) => {
        const updated = new Map(prev);
        updated.set(workflowId, {
          status: progress.runStatus?.status,
          error: progress.error,
        });
        return updated;
      });
    }
  );

  // Fetch workflows from API
  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getWorkflows()
      .then((data) => {
        setWorkflows(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;

    try {
      await api.deleteWorkflow(id);
      setWorkflows(workflows.filter((w) => w.id !== id));
    } catch (err) {
      alert(`Failed to delete workflow: ${(err as Error).message}`);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflow(workflow);
    setWorkflowForm({
      name: workflow.name,
      description: workflow.description ?? "",
    });
    setShowEditModal(true);
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const newWorkflow = await api.createWorkflow({
        name: workflowForm.name,
        description: workflowForm.description || null,
      });
      setWorkflows([...workflows, newWorkflow]);
      setShowCreateModal(false);
      setWorkflowForm({
        name: "",
        description: "",
      });
    } catch (err) {
      alert(`Failed to create workflow: ${(err as Error).message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow) return;

    setUpdating(true);

    try {
      const updatedWorkflow = await api.updateWorkflow(editingWorkflow.id, {
        name: workflowForm.name,
        description: workflowForm.description || null,
      });
      setWorkflows(workflows.map((w) => (w.id === updatedWorkflow.id ? updatedWorkflow : w)));
      setShowEditModal(false);
      setEditingWorkflow(null);
      setWorkflowForm({
        name: "",
        description: "",
      });
    } catch (err) {
      alert(`Failed to update workflow: ${(err as Error).message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Workflow Management</h2>
        <Button onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
          Create New
        </Button>
      </header>

      <main className="p-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Workflows Content */}
        {!loading && !error && (
          <div>
            {workflows.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Layers size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No workflows yet</p>
                <p className="text-sm">Create your first workflow to get started</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {workflows.map((workflow) => {
                    const runStatus = workflowStatuses.get(workflow.id);

                    const getStatusBadge = () => {
                      if (!runStatus?.status) return null;

                      const statusConfig: Record<string, { color: string; label: string }> = {
                        completed: {
                          color: "bg-green-100 text-green-700 border-green-200",
                          label: "Completed",
                        },
                        running: {
                          color: "bg-blue-100 text-blue-700 border-blue-200",
                          label: "Running",
                        },
                        failed: {
                          color: "bg-red-100 text-red-700 border-red-200",
                          label: "Failed",
                        },
                        pending: {
                          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
                          label: "Pending",
                        },
                      };

                      const config = statusConfig[runStatus.status];
                      if (!config) return null;

                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              runStatus.status === "running"
                                ? "animate-pulse bg-blue-500"
                                : runStatus.status === "completed"
                                  ? "bg-green-500"
                                  : runStatus.status === "failed"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                            }`}
                          />
                          {config.label}
                        </span>
                      );
                    };

                    return (
                      <div
                        key={workflow.id}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col h-full"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            <Layers size={20} />
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditWorkflow(workflow)}>
                              <Edit size={18} />
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteWorkflow(workflow.id)}>
                              <Trash2 size={18} />
                            </Button>
                          </div>
                        </div>
                        <div className="mb-2">{getStatusBadge()}</div>
                        <h3 className="font-semibold text-lg mb-1">{workflow.name}</h3>
                        {workflow.description && (
                          <p className="text-sm text-slate-500 line-clamp-2 mb-4">{workflow.description}</p>
                        )}
                        <div className="mt-auto pt-4 space-y-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<WorkflowIcon size={16} />}
                            onClick={() =>
                              navigate({
                                to: "/workflow-builder",
                                search: { workflowId: workflow.id },
                              })
                            }
                            className="w-full"
                          >
                            Build Workflow
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<PlayIcon size={16} />}
                            onClick={async () => {
                              const jobId = crypto.randomUUID();

                              // Register the new job so EventSource can track it
                              registerJob(jobId, workflow.id);

                              // Immediately update status to pending
                              setWorkflowStatuses((prev) => {
                                const updated = new Map(prev);
                                updated.set(workflow.id, {
                                  status: "pending",
                                });
                                return updated;
                              });

                              await api.runWorkflow(workflow.id, jobId);
                            }}
                            className="w-full"
                            disabled={runStatus?.status === "running" || runStatus?.status === "pending"}
                          >
                            {runStatus?.status === "pending" || runStatus?.status === "running"
                              ? "RUNNING"
                              : "Run Workflow"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Workflow">
        <form onSubmit={handleCreateWorkflow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Workflow Name *</label>
            <input
              type="text"
              required
              value={workflowForm.name}
              onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Content Processor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={workflowForm.description}
              onChange={(e) =>
                setWorkflowForm({
                  ...workflowForm,
                  description: e.target.value,
                })
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32"
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={creating}
              icon={creating ? <Loader2 size={16} className="animate-spin" /> : undefined}
              className="flex-1"
            >
              {creating ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingWorkflow(null);
          setWorkflowForm({
            name: "",
            description: "",
          });
        }}
        title="Edit Workflow"
      >
        <form onSubmit={handleUpdateWorkflow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Workflow Name *</label>
            <input
              type="text"
              required
              value={workflowForm.name}
              onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="e.g., Content Processor"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={workflowForm.description}
              onChange={(e) =>
                setWorkflowForm({
                  ...workflowForm,
                  description: e.target.value,
                })
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32"
              placeholder="Describe what this workflow does..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setEditingWorkflow(null);
                setWorkflowForm({
                  name: "",
                  description: "",
                });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={updating}
              icon={updating ? <Loader2 size={16} className="animate-spin" /> : undefined}
              className="flex-1"
            >
              {updating ? "Updating..." : "Update Workflow"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
