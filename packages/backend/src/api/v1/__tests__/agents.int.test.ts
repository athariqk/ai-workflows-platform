import { describe, beforeAll, afterAll, it, expect } from "vitest"
import request from "supertest"

const apiKey = "test"

let app: any

describe('Agent CRUD integration tests', () => {
  let createdId: string | null = null

  beforeAll(async () => {
    const mod = await import('../../../app')
    app = (mod && mod.default) ? mod.default : mod
  })

  afterAll(async () => {
    if (createdId) {
      try { await request(app).delete(`/v1/agents/${createdId}?api-key=${apiKey}`) } catch (e) { }
    }
  })

  it("GET /v1/agents should return 200 and an array", async () => {
    const res = await request(app).get(`/v1/agents?api-key=${apiKey}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it("POST /v1/agents should create an agent", async () => {
    const payload = { name: 'test-agent', model: 'chatgpt', system_prompt: 'hello', temperature: 0.5 }
    const res = await request(app)
      .post(`/v1/agents?api-key=${apiKey}`)
      .send(payload)

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('id')
    expect(res.body.name).toBe(payload.name)
    createdId = res.body.id
  })

  it("GET /v1/agents/:id should return the created agent", async () => {
    if (!createdId) return
    const res = await request(app).get(`/v1/agents/${createdId}?api-key=${apiKey}`)
    expect(res.status).toBe(200)
    expect(res.body.id).toBe(createdId)
  })

  it("PUT /v1/agents/:id should update the agent", async () => {
    if (!createdId) return
    const res = await request(app)
      .put(`/v1/agents/${createdId}?api-key=${apiKey}`)
      .send({ name: 'updated-name' })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('updated-name')
  })

  it("DELETE /v1/agents/:id should delete the agent", async () => {
    if (!createdId) return
    const res = await request(app).delete(`/v1/agents/${createdId}?api-key=${apiKey}`)
    expect(res.status).toBe(204)
    createdId = null
  })
})
