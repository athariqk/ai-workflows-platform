import express from "express"
import { workflowQueue, type WorkflowJobData } from "@/lib/queue"
import { prisma } from "@/lib/prisma"
import uuidv7 from "@/lib/uuid-v7"
import { BadRequest, NotFound } from "@/lib/http-error"

const router = express.Router()

/**
 * @openapi
 * components:
 *   schemas:
 *     RunWorkflowRequest:
 *       type: object
 *       properties:
 *         workflow_id:
 *           type: string
 *           format: uuid
 *       required:
 *         - workflow_id
 *     RunWorkflowResponse:
 *       type: object
 *       properties:
 *         run_id:
 *           type: string
 *           format: uuid
 *         job_id:
 *           type: string
 *         status:
 *           type: string
 *           enum: [pending, running, completed, failed]
 */

/**
 * @openapi
 * /v1/runner/run:
 *   post:
 *     summary: Start a workflow run
 *     description: Queues a workflow for asynchronous execution and returns the run ID and job ID for tracking
 *     tags:
 *       - Runner
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RunWorkflowRequest'
 *           example:
 *             workflow_id: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       201:
 *         description: Workflow run queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RunWorkflowResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post("/run", async (req, res, next) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const { workflow_id, job_id } = req.body;
        if (!workflow_id) {
            throw BadRequest("workflow_id is required");
        }
        if (!job_id) {
            throw BadRequest("job_id is required");
        }

        const workflow = await prisma.workflow.findUnique({
            where: { id: workflow_id },
        });

        if (!workflow) {
            throw NotFound("Workflow not found");
        }

        const runId = uuidv7();
        await prisma.run_log.create({
            data: {
                id: runId,
                workflow_id,
                status: "pending",
            },
        });

        const jobData: WorkflowJobData = {
            workflowId: workflow_id,
            runId,
        };

        const job = await workflowQueue.createJob(jobData)
            .setId(job_id)
            .retries(3)
            .backoff('fixed', 8000)
            .save();

        res.status(201).json({
            run_id: runId,
            job_id: job.id,
            status: job.status,
        });
    } catch (err) {
        next(err);
    }
});

router.get("/run-progress", async (req, res, next) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        workflowQueue.on("job progress", (jobId, progress) => {
            const data = {
                jobId: jobId,
                progress: progress
            }
            res.write("data: " + JSON.stringify(data) + "\n\n");
        });
    } catch (err) {
        next(err);
    }
})

/**
 * @openapi
 * /v1/runner/status/{run_id}:
 *   parameters:
 *     - name: run_id
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: The unique identifier of the workflow run
 *   get:
 *     summary: Get workflow run status
 *     description: Retrieves the current status and step-by-step execution logs of a workflow run
 *     tags:
 *       - Runner
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Run status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 workflow_id:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [pending, running, completed, failed]
 *                 started_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 finished_at:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                 error:
 *                   type: string
 *                   nullable: true
 *                 step_log:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       run_id:
 *                         type: string
 *                         format: uuid
 *                       node_id:
 *                         type: string
 *                         format: uuid
 *                       status:
 *                         type: string
 *                         enum: [pending, running, completed, failed]
 *                       input:
 *                         type: string
 *                         nullable: true
 *                       output:
 *                         type: string
 *                         nullable: true
 *                       error:
 *                         type: string
 *                         nullable: true
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                       finished_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/status/:run_id", async (req, res, next) => {
    try {
        const { run_id } = req.params;

        const runLog = await prisma.run_log.findUnique({
            where: { id: run_id },
            include: {
                step_log: {
                    orderBy: {
                        started_at: 'asc',
                    },
                },
            },
        });

        if (!runLog) {
            throw NotFound("Run not found");
        }

        res.json(runLog);
    } catch (err) {
        next(err);
    }
});

export default router
