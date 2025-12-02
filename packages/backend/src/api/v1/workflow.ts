import express from "express"
import uuidv7 from "../../lib/uuid-v7"
import { prisma } from "../../lib/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

/**
 * @openapi
 * components:
 *  schemas:
 *    Workflow:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *        name:
 *          type: string
 *        description:
 *          type: string
 *          nullable: true
 *      required:
 *        - id
 *        - name
 *    WorkflowCreate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        description:
 *          type: string
 *          nullable: true
 *      required:
 *        - name
 *    WorkflowUpdate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        description:
 *          type: string
 *          nullable: true
 */

const router = express.Router()

/**
 * @openapi
 * /v1/workflows:
 *  get:
 *    summary: List workflows
 *    tags: [Workflows]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '200':
 *        description: A list of workflows
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Workflow'
 */
router.get('/', async (req, res, next) => {
  try {
    const list = await prisma.workflow.findMany()
    res.json(list)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflows/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  get:
 *    summary: Get a workflow by id
 *    tags: [Workflows]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '200':
 *        description: Workflow found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Workflow'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const item = await prisma.workflow.findUnique({ where: { id } })
    if (!item) return res.status(404).json({ error: 'workflow not found' })
    res.json(item)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflows:
 *  post:
 *    summary: Create a workflow
 *    tags: [Workflows]
 *    security:
 *      - ApiKeyAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/WorkflowCreate'
 *    responses:
 *      '201':
 *        description: Workflow created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Workflow'
 *      '400':
 *        $ref: '#/components/responses/BadRequest'
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description = null } = req.body
    if (!name) return res.status(400).json({ error: 'name is required' })

    const created = await prisma.workflow.create({
      data: { id: uuidv7(), name, description },
    })

    res.status(201).json(created)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflows/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  put:
 *    summary: Update a workflow
 *    tags: [Workflows]
 *    security:
 *      - ApiKeyAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/WorkflowUpdate'
 *    responses:
 *      '200':
 *        description: Workflow updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Workflow'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const updated = await prisma.workflow.update({
      where: { id },
      data: { name, description },
    })

    res.json(updated)
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
        return res.status(404).json({ error: 'workflow not found' })
    next(err)
  }
})

/**
 * @openapi
 * /v1/workflows/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  delete:
 *    summary: Delete a workflow
 *    tags: [Workflows]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '204':
 *        description: Workflow deleted (no content)
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.workflow.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
        return res.status(404).json({ error: 'workflow not found' })
    next(err)
  }
})

export default router
