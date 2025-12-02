import express, { NextFunction, Request, Response } from "express"
import cors from "cors"

import apiRouter from './api/route'

const app = express()

// Enable CORS for all routes
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true
}));

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));

app.use(apiRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500)
    res.render('error', { error: err })
});

app.use((_req, res) => {
    res.status(404).json({ error: "Can't find requested path" })
});

export default app