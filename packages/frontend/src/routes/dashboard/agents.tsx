import { createFileRoute } from "@tanstack/react-router";
import {
  Database,
  Loader2,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import type { Agent } from "../../types/api";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";

export const Route = createFileRoute("/dashboard/agents")({
  component: AgentsPage,
});

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Agent form state
  const [agentForm, setAgentForm] = useState({
    name: "",
    model: "gemini" as "gemini" | "chatgpt" | "claude",
    temperature: 0.7,
    system_prompt: "",
  });

  // Fetch agents from API
  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getAgents()
      .then((data) => {
        setAgents(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleDeleteAgent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      await api.deleteAgent(id);
      setAgents(agents.filter((a) => a.id !== id));
    } catch (err) {
      alert(`Failed to delete agent: ${(err as Error).message}`);
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      model: agent.model,
      temperature: agent.temperature ?? 0.7,
      system_prompt: agent.system_prompt ?? "",
    });
    setShowEditModal(true);
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const newAgent = await api.createAgent({
        name: agentForm.name,
        model: agentForm.model,
        temperature: agentForm.temperature,
        system_prompt: agentForm.system_prompt || null,
      });
      setAgents([...agents, newAgent]);
      setShowCreateModal(false);
      setAgentForm({
        name: "",
        model: "gemini",
        temperature: 0.7,
        system_prompt: "",
      });
    } catch (err) {
      alert(`Failed to create agent: ${(err as Error).message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    setUpdating(true);

    try {
      const updatedAgent = await api.updateAgent(editingAgent.id, {
        name: agentForm.name,
        model: agentForm.model,
        temperature: agentForm.temperature,
        system_prompt: agentForm.system_prompt || null,
      });
      setAgents(agents.map((a) => (a.id === updatedAgent.id ? updatedAgent : a)));
      setShowEditModal(false);
      setEditingAgent(null);
      setAgentForm({
        name: "",
        model: "gemini",
        temperature: 0.7,
        system_prompt: "",
      });
    } catch (err) {
      alert(`Failed to update agent: ${(err as Error).message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">
          Agent Management
        </h2>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus size={16} />}
        >
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

        {/* Agents Grid */}
        {!loading && !error && (
          <div>
            {agents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Database size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium">No agents yet</p>
                <p className="text-sm">Create your first agent to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                        {agent.name.charAt(0)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditAgent(agent)}
                        >
                          <Settings size={18} />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                        {agent.model}
                      </span>
                      {agent.temperature !== null && (
                        <span className="text-xs text-slate-400">
                          Temp: {agent.temperature}
                        </span>
                      )}
                    </div>
                    {agent.system_prompt && (
                      <p className="text-sm text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                        "{agent.system_prompt}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Agent"
      >
        <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., Data Extractor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model *
                </label>
                <select
                  required
                  value={agentForm.model}
                  onChange={(e) => setAgentForm({ ...agentForm, model: e.target.value as "gemini" | "chatgpt" | "claude" })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="gemini">Gemini</option>
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperature: {agentForm.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentForm.temperature}
                  onChange={(e) => setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Precise (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={agentForm.system_prompt}
                  onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32"
                  placeholder="Describe the agent's behavior and instructions..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={creating}
                  icon={creating ? <Loader2 size={16} className="animate-spin" /> : undefined}
                  className="flex-1"
                >
                  {creating ? "Creating..." : "Create Agent"}
                </Button>
              </div>
            </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingAgent(null);
          setAgentForm({
            name: "",
            model: "gemini",
            temperature: 0.7,
            system_prompt: "",
          });
        }}
        title="Edit Agent"
      >
        <form onSubmit={handleUpdateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Agent Name *
                </label>
                <input
                  type="text"
                  required
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g., Data Extractor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Model *
                </label>
                <select
                  required
                  value={agentForm.model}
                  onChange={(e) => setAgentForm({ ...agentForm, model: e.target.value as "gemini" | "chatgpt" | "claude" })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="gemini">Gemini</option>
                  <option value="chatgpt">ChatGPT</option>
                  <option value="claude">Claude</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temperature: {agentForm.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={agentForm.temperature}
                  onChange={(e) => setAgentForm({ ...agentForm, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Precise (0.0)</span>
                  <span>Balanced (0.5)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  System Prompt
                </label>
                <textarea
                  value={agentForm.system_prompt}
                  onChange={(e) => setAgentForm({ ...agentForm, system_prompt: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none h-32"
                  placeholder="Describe the agent's behavior and instructions..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAgent(null);
                    setAgentForm({
                      name: "",
                      model: "gemini",
                      temperature: 0.7,
                      system_prompt: "",
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
                  {updating ? "Updating..." : "Update Agent"}
                </Button>
              </div>
            </form>
      </Modal>
    </>
  );
}
