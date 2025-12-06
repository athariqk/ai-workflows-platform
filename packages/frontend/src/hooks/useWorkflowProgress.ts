import { useEffect, useState, useRef } from "react";
import { api, API_BASE_URL, API_KEY } from "@/lib/api";
import type { RunLog, WorkflowProgress, WorkflowStatus, WorkflowStepProgress } from "@/types/api";

interface WorkflowProgressFromApi {
  workflowId: string;
  status: WorkflowStatus;
  currentStep?: WorkflowStepProgress;
  error?: string;
}

export function useWorkflowProgress(
  workflowIds: string[],
  onProgressReceived?: (workflowId: string, progress: WorkflowProgress) => void
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
        const logMap = new Map<string, Partial<RunLog>>();
        const jobMap = new Map<string, string>();

        await Promise.all(
          workflowIds.map(async (workflowId) => {
            try {
              const response = await api.getRunLogs({
                workflow_id: workflowId,
              });

              if (response.length > 0 && response[0]) {
                const latestRun = response[0];

                logMap.set(workflowId, latestRun);

                // Track job ID to workflow ID mapping for real-time updates
                if (latestRun.id) {
                  jobMap.set(latestRun.id, workflowId);
                }

                // Call callback with initial status
                if (onProgressReceivedRef.current && latestRun.id && latestRun.status) {
                  // If there are step logs, send progress for each step
                  if (latestRun.step_log.length > 0) {
                    for (const step of latestRun.step_log) {
                      const currentStep: WorkflowStepProgress | undefined =
                        step && step.node_id && step.name && step.status
                          ? {
                              nodeId: step.node_id,
                              name: step.name,
                              status: step.status,
                              output: step.output as string | undefined,
                              error: step.error ?? undefined,
                            }
                          : undefined;

                      const progress: WorkflowProgress = {
                        workflowId: workflowId,
                        runStatus: {
                          run_id: latestRun.id,
                          job_id: latestRun.job_id ?? "",
                          status: latestRun.status,
                        },
                        currentStep: currentStep,
                        error: latestRun.error ?? undefined,
                      };

                      onProgressReceivedRef.current(workflowId, progress);
                    }
                  } else {
                    // No step logs yet, just send run status
                    const progress: WorkflowProgress = {
                      workflowId: workflowId,
                      runStatus: {
                        run_id: latestRun.id,
                        job_id: latestRun.job_id ?? "",
                        status: latestRun.status,
                      },
                      currentStep: undefined,
                      error: latestRun.error ?? undefined,
                    };

                    onProgressReceivedRef.current(workflowId, progress);
                  }
                }
              } else {
                logMap.set(workflowId, {
                  workflow_id: workflowId,
                });
              }
            } catch (err) {
              console.error(`Failed to fetch status for workflow ${workflowId}:`, err);
              logMap.set(workflowId, {
                workflow_id: workflowId,
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
            data: WorkflowProgressFromApi;
          };
        };
        const workflowProgress = progressWrapper.data;
        const workflowId = jobToWorkflowMapRef.current.get(jobId);

        if (!workflowId || !workflowIds.includes(workflowId)) {
          // This job doesn't belong to any of our tracked workflows
          return;
        }

        if (onProgressReceivedRef.current) {
          // Call callback with workflow progress data
          onProgressReceivedRef.current(workflowId, {
            workflowId: workflowProgress.workflowId,
            runStatus: {
              status: workflowProgress.status,
              run_id: "",
              job_id: "",
            },
            currentStep: workflowProgress.currentStep,
            error: workflowProgress.error,
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
