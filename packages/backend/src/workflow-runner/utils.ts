import Queue from "bee-queue";
import { JobProgress, JobProgressType } from "@/lib/types.js";

export function reportProgress<T>(job: Queue.Job<T>, type: JobProgressType, data: unknown) {
  job.reportProgress({
    type: type,
    data: data,
  } as JobProgress);
}
