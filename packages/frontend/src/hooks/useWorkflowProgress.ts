import { useEffect, useState, useRef } from "react";
import { API_BASE_URL, API_KEY } from "@/lib/api";
import type { WorkflowProgress, WorkflowRun, WorkflowStatus } from "@/types/api";

export function useWorkflowProgress(
    currentRun: WorkflowRun | null,
    onProgress: (progress: WorkflowProgress) => void,
) {
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("idle");
    const [workflowError, setWorkflowError] = useState<string | null>(null);
    
    // Use ref to store latest callback without triggering effect re-runs
    const onProgressRef = useRef(onProgress);
    
    useEffect(() => {
        onProgressRef.current = onProgress;
    }, [onProgress]);

    useEffect(() => {
        if (!currentRun?.job_id) {
            setWorkflowStatus("idle");
            return;
        }

        setWorkflowStatus("idle");
        setWorkflowError(null);

        const url = new URL("/v1/runner/run-progress", API_BASE_URL);
        url.searchParams.set("api_key", API_KEY);

        const eventSource = new EventSource(url.toString());

        eventSource.onopen = () => {
            // EventSource connection opened
            console.log("EventSource connection opened")
        };

        eventSource.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                const { jobId, progress: progressWrapper } = message as { jobId: string; progress: { type: string; data: WorkflowProgress } };
                const workflowProgress = progressWrapper.data;

                if (jobId !== currentRun.job_id) {
                    // Ignore events for other runs
                    return;
                }

                // When currentStep is undefined, progress status is interpreted as workflow-wide
                if (!workflowProgress.currentStep && workflowProgress.status) {
                    setWorkflowStatus(workflowProgress.status);
                    if (workflowProgress.status === "failed" && workflowProgress.error) {
                        setWorkflowError(workflowProgress.error);
                    }
                    if (workflowProgress.status === "failed" || workflowProgress.status == "completed") {
                        // Reached an end state
                        eventSource.close();
                    }
                }

                // Use ref to call latest callback
                onProgressRef.current(workflowProgress);
            } catch (err) {
                console.error("Failed to parse progress event:", err);
            }
        };

        eventSource.onerror = (error) => {
            console.error("EventSource failed:", error);
            eventSource.close();
        };

        return () => {
            console.log("closing EventSource");
            eventSource.close();
        };
    }, [currentRun]);

    return { workflowStatus, workflowError };
}
