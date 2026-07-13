import { execSync } from 'child_process';
import { prisma } from '../src/config';
import { clearRouteCache } from '../src/services/routeCache';

let isFirstRun = true;

/**
 * Sets up a fresh test database before the first test in each file.
 * Resets the database to ensure test isolation.
 */
export async function setupTestDb() {
  if (isFirstRun) {
    execSync('npx prisma db push --force-reset', {
      stdio: 'pipe',
      env: { ...process.env },
    });
    isFirstRun = false;
  } else {
    // Wrap all cleanup in a single transaction to ensure same connection
    await prisma.$transaction([
      prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF'),
      prisma.$executeRawUnsafe('DELETE FROM "Message"'),
      prisma.$executeRawUnsafe('DELETE FROM "RouteCache"'),
      prisma.$executeRawUnsafe('DELETE FROM "Transaction"'),
      prisma.$executeRawUnsafe('DELETE FROM "WalletWithdrawal"'),
      prisma.$executeRawUnsafe('DELETE FROM "Order"'),
      prisma.$executeRawUnsafe('DELETE FROM "Shift"'),
      prisma.$executeRawUnsafe('DELETE FROM "Courier"'),
      prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON'),
    ]);
    clearRouteCache();
  }
}

export async function teardownTestDb() {
  // No-op; globalTeardown handles final cleanup
}
