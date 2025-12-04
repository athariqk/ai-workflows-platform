/**
 * @openapi
 * components:
 *  schemas:
 *    ModelType:
 *      type: string
 *      enum:
 *        - gemini_2_5_flash
 *        - gpt_5_mini
 *        - claude_sonnet_4_5
 *    WorkflowNodeType:
 *      type: string
 *      enum:
 *        - text_input
 *        - agent
 *  responses:
 *    NotFound:
 *      description: Resource not found
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: string
 *    BadRequest:
 *      description: Bad request
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              error:
 *                type: string
 *  securitySchemes:
 *    ApiKeyAuth:
 *      type: apiKey
 *      name: api_key
 *      in: query
 */