import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/error';

import authRoutes from './routes/auth';
import courierRoutes from './routes/couriers';
import shiftRoutes from './routes/shifts';
import orderRoutes from './routes/orders';
import walletRoutes from './routes/wallet';
import chatRoutes from './routes/chat';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Root route - redirect to docs
  app.get('/', (_req, res) => {
    res.redirect('/docs');
  });

  // Swagger UI - works both in dev (src/) and production (dist/)
  let openapiPath = path.join(__dirname, 'openapi.yaml');
  if (!fs.existsSync(openapiPath)) {
    // Fallback for dev environment
    openapiPath = path.join(__dirname, '..', 'src', 'openapi.yaml');
  }
  if (fs.existsSync(openapiPath)) {
    const openapiDoc = yaml.load(fs.readFileSync(openapiPath, 'utf8')) as object;
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));
  }

  // Routes
  app.use('/auth', authRoutes);
  app.use('/couriers', courierRoutes);
  app.use('/shifts', shiftRoutes);
  app.use('/orders', orderRoutes);
  app.use('/wallet', walletRoutes);
  app.use('/orders', chatRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Error handler (must be last)
  app.use(errorHandler as any);

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Delivery Buddy API running on port ${config.port}`);
    console.log(`Swagger docs at http://localhost:${config.port}/docs`);
  });
}

export default app;
