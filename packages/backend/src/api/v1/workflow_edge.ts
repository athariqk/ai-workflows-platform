import express from "express"
import uuidv7 from "../../lib/uuid-v7"
import { prisma } from "../../lib/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkflowEdge:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         workflow_id:
 *           type: string
 *           format: uuid
 *         source_node_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         target_node_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *       required:
 *         - id
 *         - workflow_id
 *
 *     WorkflowEdgeCreate:
 *       type: object
 *       properties:
 *         workflow_id:
 *           type: string
 *           format: uuid
 *         source_node_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         target_node_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *       required:
 *         - workflow_id
 */

const router = express.Router()

/**
 * @openapi
 * /workflow-edges:
 *   get:
 *     summary: List all workflow edges
 *     tags: [Workflow Edges]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of workflow edges
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkflowEdge'
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.workflow_edge.findMany()
    res.json(list)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /workflow-edges/{id}:
 *   get:
 *     summary: Get a workflow edge by ID
 *     tags: [Workflow Edges]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow edge ID
 *     responses:
 *       200:
 *         description: The workflow edge data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowEdge'
 *       404:
 *         description: Workflow edge not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const item = await prisma.workflow_edge.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'workflow_edge not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /workflow-edges:
 *   post:
 *     summary: Create a new workflow edge
 *     tags: [Workflow Edges]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowEdgeCreate'
 *     responses:
 *       201:
 *         description: The created workflow edge
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowEdge'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
router.post('/', async (req, res, next) => {
  try {
    const { workflow_id, source_node_id = null, target_node_id = null } = req.body
    if (!workflow_id) return res.status(400).json({ error: 'workflow_id is required' })

    const created = await prisma.workflow_edge.create({
      data: { id: uuidv7(), workflow_id, source_node_id, target_node_id },
    })

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /workflow-edges/{id}:
 *   put:
 *     summary: Update a workflow edge
 *     tags: [Workflow Edges]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow edge ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkflowEdgeCreate'
 *     responses:
 *       200:
 *         description: The updated workflow edge
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkflowEdge'
 *       404:
 *         description: Workflow edge not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { workflow_id, source_node_id, target_node_id } = req.body

    const updated = await prisma.workflow_edge.update({
      where: { id },
      data: { workflow_id, source_node_id, target_node_id },
    })

    res.json(updated)
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'workflow_edge not found' })
    next(err)
  }
})

/**
 * @openapi
 * /workflow-edges/{id}:
 *   delete:
 *     summary: Delete a workflow edge
 *     tags: [Workflow Edges]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The workflow edge ID
 *     responses:
 *       204:
 *         description: Successfully deleted
 *       404:
 *         description: Workflow edge not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.workflow_edge.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'workflow_edge not found' })
    next(err)
  }
})

export default router
