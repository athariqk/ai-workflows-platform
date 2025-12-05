import "dotenv/config";
import app from "./app.js"
import { prisma } from "./lib/prisma.js"
import { startWorker } from "./workflow-runner/runner.js"

const port = process.env.BACKEND_PORT || 3000

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    prisma
        .$connect()
        .then(() => {
            console.log("✓ Prisma connected")

            // Start the workflow queue worker after prisma because it needs database access
            startWorker()
        })
        .catch((err: unknown) => {
            console.error("✗ Error connecting to Prisma:", err)
        })
})