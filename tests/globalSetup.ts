import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default async function () {
  // Generate Prisma client and push schema to test database
  execSync('npx prisma generate', { stdio: 'pipe' });
  execSync('npx prisma db push --force-reset', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
};
