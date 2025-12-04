import { useEffect, useState } from "react";
import { type Node } from "@xyflow/react";
import { API_BASE_URL, API_KEY } from "@/lib/api";
import type { WorkflowRun, WorkflowStatus } from "@/types/api";

export function useWorkflowProgress(
    currentRun: WorkflowRun | null,
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>
) {
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("idle");
    useEffect(() => {
        if (!currentRun?.job_id) {
            setWorkflowStatus("idle");
            return;
        }

        setWorkflowStatus("idle");

        const url = new URL("/v1/runner/run-progress", API_BASE_URL);
        url.searchParams.set("api_key", API_KEY);
        url.searchParams.set("job_id", currentRun.job_id);

        const eventSource = new EventSource(url.toString());

        eventSource.onmessage = (event) => {
            try {
                const progressData = JSON.parse(event.data);

                // When currentNodeId is null, progress status is workflow-wide
                if (progressData.currentNodeId === null) {
                    setWorkflowStatus(progressData.status);
                }

                // Update node status based on progress
                setNodes((currentNodes) =>
                    currentNodes.map((node) => {
                        if (node.id === progressData.currentNodeId) {
                            return {
                                ...node,
                                data: {
                                    ...node.data,
                                    output: progressData.output,
                                    status: progressData.status,
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
            eventSource.close();
        };
    }, [currentRun, setNodes]);

    return { workflowStatus };
}
