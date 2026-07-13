import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
});

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  routeCacheTtlSeconds: parseInt(process.env.ROUTE_CACHE_TTL || '60', 10),
  mockGeocoding: process.env.MOCK_GEOCODING !== 'false',
  nodeEnv: process.env.NODE_ENV || 'development',
};
