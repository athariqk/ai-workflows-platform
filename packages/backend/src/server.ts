import "dotenv/config";
import app from "./app"
import { prisma } from "./lib/prisma"
import { startWorker } from "./workflow-runner/runner"

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    prisma
        .$connect()
        .then(() => {
            console.log("✓ Prisma connected")

            // Start the workflow queue worker after prisma because it needs database access
            startWorker()
        })
        .catch((err) => {
            console.error("✗ Error connecting to Prisma:", err)
        })
})