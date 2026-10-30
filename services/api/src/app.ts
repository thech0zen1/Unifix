import express, { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import helmet from 'helmet';
import cors from 'cors';
import { getConfig } from '@unifix/shared-config';

const prisma = new PrismaClient();

// Initialize Express application
const app: Application = express();

// Load configuration
const config = getConfig();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// CORS configuration
const allowedOrigins = config.webOrigin ? [config.webOrigin] : [];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
export function errorHandler(
  err: Error,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
}

app.use(errorHandler);

// Export app for testing
export { app };

export default prisma;
