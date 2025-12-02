import "dotenv/config";
import app from "./app"
import { prisma } from "./lib/prisma"

const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
    prisma
        .$connect()
        .then(() => {
            console.log("Prisma connected")
        })
        .catch((err) => {
            console.error("Error connecting to Prisma:", err)
        })
})