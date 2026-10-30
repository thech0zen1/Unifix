import { app } from './app';
import { getConfig } from '@unifix/shared-config';
import { PrismaClient } from '@prisma/client';

const config = getConfig();
const port = config.port || 3000;

const prisma = new PrismaClient();

// Start database connection
prisma
  .$connect()
  .then(() => {
    console.log('✅ Database connected');
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
});
