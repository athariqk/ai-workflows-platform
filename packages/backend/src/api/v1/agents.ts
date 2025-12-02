import express from "express"
import uuidv7 from "../../lib/uuid-v7"
import { prisma } from "../../lib/prisma"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

/**
 * @openapi
 * components:
 *  schemas:
 *    Agent:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          format: uuid
 *        name:
 *          type: string
 *        model:
 *          $ref: '#/components/schemas/ModelType'
 *        system_prompt:
 *          type: string
 *          nullable: true
 *        temperature:
 *          type: number
 *          format: float
 *          nullable: true
 *      required:
 *        - id
 *        - name
 *        - model

 *    AgentCreate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        model:
 *          $ref: '#/components/schemas/ModelType'
 *        system_prompt:
 *          type: string
 *          nullable: true
 *        temperature:
 *          type: number
 *          format: float
 *          nullable: true
 *      required:
 *        - name
 *        - model

 *    AgentUpdate:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        model:
 *          $ref: '#/components/schemas/ModelType'
 *        system_prompt:
 *          type: string
 *          nullable: true
 *        temperature:
 *          type: number
 *          format: float
 *          nullable: true
 */

const router = express.Router()

/**
 * @openapi
 * /v1/agents:
 *  get:
 *    summary: List agents
 *    tags: [Agents]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '200':
 *        description: A list of agents
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Agent'
 */
router.get('/', async (req, res, next) => {
  try {
    const agents = await prisma.agent.findMany()
    res.json(agents)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/agents/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  get:
 *    summary: Get an agent by id
 *    tags: [Agents]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '200':
 *        description: Agent found
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Agent'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const agent = await prisma.agent.findUnique({ where: { id } })
    if (!agent) return res.status(404).json({ error: 'agent not found' })
    res.json(agent)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/agents:
 *  post:
 *    summary: Create an agent
 *    tags: [Agents]
 *    security:
 *      - ApiKeyAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AgentCreate'
 *    responses:
 *      '201':
 *        description: Agent created
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Agent'
 *      '400':
 *        $ref: '#/components/responses/BadRequest'
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, model, system_prompt = null, temperature = null } = req.body
    if (!name || !model)
      return res.status(400).json({ error: 'name and model are required' })

    const newAgent = await prisma.agent.create({
      data: {
        id: uuidv7(),
        name,
        model,
        system_prompt,
        temperature,
      },
    })

    res.status(201).json(newAgent)
  } catch (err) {
    next(err)
  }
})

/**
 * @openapi
 * /v1/agents/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  put:
 *    summary: Update an agent
 *    tags: [Agents]
 *    security:
 *      - ApiKeyAuth: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/schemas/AgentUpdate'
 *    responses:
 *      '200':
 *        description: Agent updated
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Agent'
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, model, system_prompt, temperature } = req.body

    const updated = await prisma.agent.update({
      where: { id },
      data: { name, model, system_prompt, temperature },
    })

    res.json(updated)
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'agent not found' })
    next(err)
  }
})

/**
 * @openapi
 * /v1/agents/{id}:
 *  parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *       format: uuid
 *  delete:
 *    summary: Delete an agent
 *    tags: [Agents]
 *    security:
 *      - ApiKeyAuth: []
 *    responses:
 *      '204':
 *        description: Agent deleted (no content)
 *      '404':
 *        $ref: '#/components/responses/NotFound'
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params
    await prisma.agent.delete({ where: { id } })
    res.status(204).send()
  } catch (err) {
    if ((err as PrismaClientKnownRequestError).code === 'P2025')
      return res.status(404).json({ error: 'agent not found' })
    next(err)
  }
})

export default router