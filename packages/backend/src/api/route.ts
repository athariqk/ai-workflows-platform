import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import agentsRouter from "./v1/agents.js";
import workflowsRouter from "./v1/workflow.js";
import workflowEdgesRouter from "./v1/workflow_edge.js";
import workflowNodesRouter from "./v1/workflow_node.js";
import runnerRouter from "./v1/runner.js";
import { Forbidden } from "@/lib/http-error.js";

const router = express.Router();

const specs = swaggerJsdoc({
  failOnErrors: true,
  definition: {
    openapi: "3.0.3",
    info: {
      title: "AWP Backend API",
      version: "1.0",
    },
    servers: [{ url: "http://localhost:3000", description: "Local development server" }],
  },
  apis: ["./src/api/v1/*.ts", "./src/api/v1/openapi.ts"],
});
router.use("/v1/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

router.use(function (req, res, next) {
  const key = req.query["api_key"];

  // key isn't present
  if (!key) throw Forbidden("api key required");

  next();
});

router.use("/v1/agents", agentsRouter);
router.use("/v1/workflows", workflowsRouter);
router.use("/v1/workflow-edges", workflowEdgesRouter);
router.use("/v1/workflow-nodes", workflowNodesRouter);
router.use("/v1/runner", runnerRouter);

export default router;
