// API Routes
import express from 'express';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
router.use('*', (req, res) => {
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

export default router;
