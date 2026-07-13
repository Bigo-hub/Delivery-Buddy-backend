import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default async function () {
  // Push schema to test database - skip prisma generate to avoid Windows file locking issues
  execSync('npx prisma db push --force-reset', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
};
