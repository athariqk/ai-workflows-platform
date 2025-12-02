import express from 'express'
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import agentsRouter from "./v1/agents"
import workflowsRouter from "./v1/workflow"
import workflowEdgesRouter from "./v1/workflow_edge"
import workflowNodesRouter from "./v1/workflow_node"

const router = express.Router()

const specs = swaggerJsdoc({
    failOnErrors: true,
    definition: {
        openapi: '3.0.3',
        info: {
            title: "AWP Backend API",
            version: "1.0"
        },
        servers: [
            { url: "http://localhost:3000", description: "Local development server" }
        ],
    },
    apis: ["./src/api/v1/*.ts", "./src/api/openapi.ts"]
});
router.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs)
);

router.use(function (req, res, next) {
    const key = req.query['api_key'];

    // key isn't present
    if (!key)
        throw new Error('api key required');

    next();
});

router.use("/v1/agents", agentsRouter)
router.use("/v1/workflows", workflowsRouter)
router.use("/v1/workflow_edges", workflowEdgesRouter)
router.use("/v1/workflow_nodes", workflowNodesRouter)

export default router
