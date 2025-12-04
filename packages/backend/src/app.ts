import express, { NextFunction, Request, Response } from "express"
import cors from "cors"

import apiRouter from './api/route'
import { HttpError } from './lib/http-error'

const app = express()

// Enable CORS for all routes
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true
}));

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (no auth required)
app.get('/health', (_req, res) => {
    res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.use(apiRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

app.use((_req, res) => {
    res.status(404).json({ error: "Can't find requested path" })
});

export default app