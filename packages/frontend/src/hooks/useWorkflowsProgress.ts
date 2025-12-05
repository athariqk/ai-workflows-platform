import { useEffect, useState, useRef } from "react";
import { api, API_BASE_URL, API_KEY } from "@/lib/api";
import type { WorkflowStatus, WorkflowProgress } from "@/types/api";

interface WorkflowRunStatus {
  workflowId: string;
  latestRunId?: string;
  latestJobId?: string;
  status?: WorkflowStatus;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export function useWorkflowsProgress(
  workflowIds: string[],
  onProgressReceived?: (workflowId: string, status: WorkflowRunStatus) => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to store latest values without triggering effect re-runs
  const onProgressReceivedRef = useRef(onProgressReceived);
  const jobToWorkflowMapRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    onProgressReceivedRef.current = onProgressReceived;
  }, [onProgressReceived]);

  useEffect(() => {
    if (workflowIds.length === 0) {
      jobToWorkflowMapRef.current = new Map();
      return;
    }

    let isMounted = true;

    // Initial fetch of latest run statuses
    async function fetchInitialStatuses() {
      setLoading(true);
      setError(null);

      try {
        const statusMap = new Map<string, WorkflowRunStatus>();
        const jobMap = new Map<string, string>();

        await Promise.all(
          workflowIds.map(async (workflowId) => {
            try {
              const response = await api.getRunLogs({
                workflow_id: workflowId,
              });

              if (response.length > 0 && response[0]) {
                const latestRun = response[0];
                const status: WorkflowRunStatus = {
                  workflowId,
                  latestRunId: latestRun.id,
                  latestJobId: latestRun.job_id,
                  status: latestRun.status ?? undefined,
                  startedAt: latestRun.started_at ?? undefined,
                  finishedAt: latestRun.finished_at ?? undefined,
                  error: latestRun.error ?? undefined,
                };

                statusMap.set(workflowId, status);

                // Track job ID to workflow ID mapping for real-time updates
                if (latestRun.job_id) {
                  jobMap.set(latestRun.job_id, workflowId);
                }

                // Call callback with initial status
                if (onProgressReceivedRef.current) {
                  onProgressReceivedRef.current(workflowId, status);
                }
              } else {
                statusMap.set(workflowId, {
                  workflowId,
                });
              }
            } catch (err) {
              console.error(
                `Failed to fetch status for workflow ${workflowId}:`,
                err
              );
              statusMap.set(workflowId, {
                workflowId,
              });
            }
          })
        );

        if (isMounted) {
          jobToWorkflowMapRef.current = jobMap;
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
          setLoading(false);
        }
      }
    }

    fetchInitialStatuses();

    // Set up EventSource for real-time updates
    const url = new URL("/v1/runner/run-progress", API_BASE_URL);
    url.searchParams.set("api_key", API_KEY);

    const eventSource = new EventSource(url.toString());

    eventSource.onopen = () => {
      // EventSource connection opened
      console.log("EventSource connection opened");
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { jobId, progress: progressWrapper } = message as {
          jobId: string;
          progress: {
            type: string;
            data: WorkflowProgress
          }
        };
        const workflowProgress = progressWrapper.data;

        // Find which workflow this job belongs to
        const workflowId = jobToWorkflowMapRef.current.get(jobId);

        if (!workflowId || !workflowIds.includes(workflowId)) {
          // This job doesn't belong to any of our tracked workflows
          return;
        }

        // Only call callback when we have workflow-level status (workflowProgress.status is defined)
        // Step-level updates have currentStep with its own status, but workflowProgress.status is undefined
        if (onProgressReceivedRef.current && workflowProgress.status) {
          onProgressReceivedRef.current(workflowId, {
            workflowId,
            status: workflowProgress.status,
            error: workflowProgress.status === "failed" ? workflowProgress.error : undefined,
          });
        }
      } catch (err) {
        console.error("Failed to parse progress event:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
    };

    return () => {
      isMounted = false;
      console.log("closing EventSource");
      eventSource.close();
    };
  }, [workflowIds.join(",")]);

  const registerJob = (jobId: string, workflowId: string) => {
    jobToWorkflowMapRef.current.set(jobId, workflowId);
  };

  return {
    loading,
    error,
    registerJob,
  };
}
