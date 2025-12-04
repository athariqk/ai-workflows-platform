import { useEffect, useState } from "react";
import { type Node } from "@xyflow/react";
import { API_BASE_URL, API_KEY } from "@/lib/api";
import type { WorkflowRun, WorkflowStatus } from "@/types/api";

export function useWorkflowProgress(
    currentRun: WorkflowRun | null,
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>
) {
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("idle");
    const [workflowError, setWorkflowError] = useState<string | null>(null);

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
            console.log("EventSource connection opened");
        }

        eventSource.onmessage = (event) => {
            try {
                const { jobId, progress } = JSON.parse(event.data);

                if (jobId !== currentRun.job_id) {
                    // Ignore events for other runs
                    return;
                }

                // When currentNodeId is null, progress status is interpreted as workflow-wide
                if (progress.currentNodeId === null) {
                    setWorkflowStatus(progress.status);
                    if (progress.status === "failed" && progress.error) {
                        setWorkflowError(progress.error);
                    }
                    if (progress.status === "failed" || progress.status == "completed") {
                        // Reached an end state
                        eventSource.close();
                    }
                }

                // Update node status based on progress
                setNodes((currentNodes) =>
                    currentNodes.map((node) => {
                        if (node.id === progress.currentNodeId) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    output: progress.output,
                                    status: progress.status,
                                    error: progress.error || undefined,
                                },
                            };
                        }
                        return node;
                    })
                );
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
    }, [currentRun, setNodes]);

    return { workflowStatus, workflowError };
}
