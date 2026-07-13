import { execSync } from 'child_process';

export default async function () {
  // Clean up test database
  try {
    execSync('rm -f prisma/test.db', { stdio: 'pipe' });
  } catch {
    // ignore
  }
};
