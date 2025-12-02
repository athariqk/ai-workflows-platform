import express from "express"
import uuidv7 from "../../lib/uuid-v7"
import { prisma } from "../../lib/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

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
 *       required:
 *         - id
 *         - workflow_id
 *
 *     WorkflowNodeCreate:
 *       type: object
 *       properties:
 *         workflow_id:
 *           type: string
 *           format: uuid
 *       required:
 *         - workflow_id
 */

const router = express.Router()

/**
 * @openapi
 * /workflow-nodes:
 *   get:
 *     summary: List all workflow nodes
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
 *       500:
 *         description: Internal server error
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
 * /workflow-nodes/{id}:
 *   get:
 *     summary: Get a workflow node by ID
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
 *         description: Workflow node not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const item = await prisma.workflow_node.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'workflow_node not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /workflow-nodes:
 *   post:
 *     summary: Create a new workflow node
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
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res, next) => {
  try {
    const { workflow_id } = req.body
    if (!workflow_id) return res.status(400).json({ error: 'workflow_id is required' })

    const created = await prisma.workflow_node.create({
      data: { id: uuidv7(), workflow_id },
    })

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /workflow-nodes/{id}:
 *   put:
 *     summary: Update a workflow node
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
 *         description: Workflow node not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { workflow_id } = req.body

    const updated = await prisma.workflow_node.update({
      where: { id },
      data: { workflow_id },
    })

    res.json(updated)
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'workflow_node not found' })
    next(err)
  }
})

/**
 * @openapi
 * /workflow-nodes/{id}:
 *   delete:
 *     summary: Delete a workflow node
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
 *         description: Workflow node not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.workflow_node.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'workflow_node not found' })
    next(err)
  }
})

export default router
