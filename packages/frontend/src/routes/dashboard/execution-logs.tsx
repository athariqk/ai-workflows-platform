import { api } from "@/lib/api";
import type { RunLog } from "@/types/api";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/execution-logs")({
  component: ExecutionLogsPage,
});

function ExecutionLogsPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleSteps = (logId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  };

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const response = await api.getRunLogs();
        setLogs(response);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  return (
    <div>
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex gap-5 sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-slate-800">
          Execution Logs ({logs.length})
        </h2>
        <span className="mb-4 text-sm text-slate-400">Refresh this page to see the latest execution logs and state.</span>
      </header>

      <div className="p-8">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-indigo-600" />
            <span className="ml-3 text-slate-600">Loading...</span>
          </div>
        )}

        {!loading &&
          !error &&
          logs.map((log) => {
            const getStatusColor = (status: string | null) => {
              switch (status) {
                case "completed":
                  return "bg-green-100 text-green-800 border-green-200";
                case "running":
                  return "bg-blue-100 text-blue-800 border-blue-200";
                case "failed":
                  return "bg-red-100 text-red-800 border-red-200";
                case "pending":
                  return "bg-yellow-100 text-yellow-800 border-yellow-200";
                default:
                  return "bg-slate-100 text-slate-800 border-slate-200";
              }
            };

            const formatDate = (date: string | null) => {
              if (!date) return "N/A";
              return new Date(date).toLocaleString();
            };

            const duration =
              log.started_at && log.finished_at
                ? Math.round(
                    (new Date(log.finished_at).getTime() -
                      new Date(log.started_at).getTime()) /
                      1000
                  )
                : null;

            return (
              <div
                key={log.id}
                className="mb-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {log.workflow?.name ?? "Unknown Workflow"}
                      </h3>
                      <p className="text-sm text-slate-500 font-mono">
                        {log.id}
                      </p>
                    </div>
                    {log.status && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          log.status
                        )}`}
                      >
                        {log.status.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Started</p>
                      <p className="text-sm text-slate-700">
                        {formatDate(log.started_at ?? null)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Finished</p>
                      <p className="text-sm text-slate-700">
                        {formatDate(log.finished_at ?? null)}
                      </p>
                    </div>
                  </div>

                  {duration !== null && (
                    <div className="mb-4">
                      <p className="text-xs text-slate-500 mb-1">Duration</p>
                      <p className="text-sm text-slate-700">
                        {duration}s ({Math.floor(duration / 60)}m{" "}
                        {duration % 60}s)
                      </p>
                    </div>
                  )}

                  {log.error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Error
                      </p>
                      <p className="text-sm text-red-700">{log.error}</p>
                    </div>
                  )}

                  {log.step_log && log.step_log.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => toggleSteps(log.id)}
                        className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        {expandedSteps.has(log.id) ? (
                          <ChevronDown size={16} className="transition-transform" />
                        ) : (
                          <ChevronRight size={16} className="transition-transform" />
                        )}
                        Steps ({log.step_log.length})
                      </button>
                      {expandedSteps.has(log.id) && (
                        <div className="space-y-3">
                          {log.step_log.map((step, idx) => (
                            <div
                              key={step.id}
                              className="border border-slate-200 rounded-md p-3 bg-slate-50 hover:bg-slate-100 transition-colors duration-150"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-slate-400">#{idx + 1}</span>
                                <span className="font-medium">{step.name}</span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    step.status === "completed"
                                      ? "bg-green-500"
                                      : step.status === "failed"
                                        ? "bg-red-500"
                                        : step.status === "running"
                                          ? "bg-blue-500"
                                          : "bg-slate-300"
                                  }`}
                                />
                                <span className="text-slate-600 text-sm">
                                  {step.status || "unknown"}
                                </span>
                              </div>
                              {step.error && (
                                <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded border border-red-200">
                                  {step.error}
                                </div>
                              )}
                              {step.input && (
                                <div className="mb-2">
                                  <p className="text-xs font-medium text-slate-600 mb-1">Input:</p>
                                  <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-x-auto hover:border-slate-300 transition-colors cursor-text select-text">
                                    {JSON.stringify(step.input, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {step.output && (
                                <div>
                                  <p className="text-xs font-medium text-slate-600 mb-1">Output:</p>
                                  <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-x-auto hover:border-slate-300 transition-colors cursor-text select-text">
                                    {JSON.stringify(step.output, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
