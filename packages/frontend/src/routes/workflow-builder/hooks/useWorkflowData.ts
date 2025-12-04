import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Workflow, Agent } from "@/types/api";

export function useWorkflowData(workflowId?: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Fetch agents
  useEffect(() => {
    setAgentsLoading(true);
    api
      .getAgents()
      .then((data) => {
        setAgents(data);
        setAgentsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load agents:", err);
        setAgentsLoading(false);
      });
  }, []);

  // Fetch workflow
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

  return {
    workflow,
    loading,
    error,
    agents,
    agentsLoading,
  };
}
