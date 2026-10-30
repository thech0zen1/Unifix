import { app } from './app';
import { getConfig } from '@unifix/shared-config';
import { PrismaClient } from '@prisma/client';
import { startEscalationScheduler, stopEscalationScheduler } from './lib/escalationEngine';

const config = getConfig();
const port = config.port || 3000;
const prisma = new PrismaClient();

// Connect to database and start server
prisma
  .$connect()
  .then(() => {
    console.log('✅ PostgreSQL database connected successfully');

    // Start background escalation scheduler
    startEscalationScheduler(15 * 60 * 1000); // Check every 15 minutes

    const server = app.listen(port, () => {
      console.log(`🚀 Unifix API Server listening on port ${port} (http://localhost:${port}/api/v1)`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      stopEscalationScheduler();
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected and HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((err) => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });

process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Rejection:', reason);
});
