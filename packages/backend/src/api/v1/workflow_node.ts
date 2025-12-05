import express from "express"
import uuidv7 from "@/lib/uuid-v7.js"
import { prisma } from "@/lib/prisma.js"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"
import { BadRequest, NotFound } from "@/lib/http-error.js"

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkflowNode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         workflow_id:
 *           type: string
 *           format: uuid
 *         config:
 *            type: object
 *       required:
 *         - id
 *         - workflow_id
 *         - type
 *         - config
 *
 *     WorkflowNodeCreate:
 *       type: object
 *       properties:
 *         workflow_id:
 *           type: string
 *           format: uuid
 *         config:
 *            type: object
 *       required:
 *         - workflow_id
 *         - config
 */

const router = express.Router()

/**
 * @openapi
 * /v1/workflow-nodes:
 *   get:
 *     summary: List all workflow nodes
 *     description: Retrieve all workflow nodes in the system
 *     tags: [Workflow Nodes]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of workflow nodes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkflowNode'
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.workflow_node.findMany()
    res.json(list)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflow-nodes/{id}:
 *   get:
 *     summary: Get a workflow node by ID
 *     description: Retrieve a specific workflow node by its unique identifier
 *     tags: [Workflow Nodes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow node ID
 *     responses:
 *       200:
 *         description: The workflow node data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowNode'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const item = await prisma.workflow_node.findUnique({ where: { id } })
    if (!item) throw NotFound('Workflow node not found')
    res.json(item)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflow-nodes:
 *   post:
 *     summary: Create a new workflow node
 *     description: Create a new node in a workflow with specified configuration
 *     tags: [Workflow Nodes]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowNodeCreate'
 *     responses:
 *       201:
 *         description: The created workflow node
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowNode'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
router.post('/', async (req, res, next) => {
  try {
    const { workflow_id, config } = req.body
    if (!workflow_id) throw BadRequest('workflow_id is required')

    const created = await prisma.workflow_node.create({
      data: {
        id: uuidv7(),
        workflow_id: workflow_id,
        config: config,
      },
    })

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflow-nodes/{id}:
 *   put:
 *     summary: Update a workflow node
 *     description: Update an existing workflow node by ID
 *     tags: [Workflow Nodes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow node ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowNodeCreate'
 *     responses:
 *       200:
 *         description: The updated workflow node
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowNode'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { workflow_id, config } = req.body

    const updated = await prisma.workflow_node.update({
      where: { id },
      data: { workflow_id, config },
    })

    res.json(updated)
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      throw NotFound('Workflow node not found')
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflow-nodes/{id}:
 *   delete:
 *     summary: Delete a workflow node
 *     description: Remove a workflow node from the system
 *     tags: [Workflow Nodes]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow node ID
 *     responses:
 *       204:
 *         description: Successfully deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.workflow_node.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      throw NotFound('Workflow node not found')
    next(err)
  }
})

export default router
