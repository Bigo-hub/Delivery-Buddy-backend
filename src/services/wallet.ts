import { prisma } from '../config';

export interface WalletSummary {
  balance: number;
  tips: number;
  rate: number;
  level: number;
}

/**
 * Computes the current wallet balance as the sum of all earning + tip
 * transactions minus the sum of all completed withdrawals.
 */
export async function computeWalletBalance(courierId: string): Promise<number> {
  const earnings = await prisma.transaction.aggregate({
    where: { courierId, type: { in: ['earning', 'tip'] } },
    _sum: { amount: true },
  });
  const withdrawals = await prisma.transaction.aggregate({
    where: { courierId, type: 'withdrawal' },
    _sum: { amount: true },
  });
  const earned = earnings._sum.amount ?? 0;
  const withdrawn = withdrawals._sum.amount ?? 0;
  return Math.round((earned - withdrawn) * 100) / 100;
}

export async function getWalletSummary(courierId: string): Promise<WalletSummary> {
  const courier = await prisma.courier.findUnique({ where: { id: courierId } });
  if (!courier) throw new Error('Courier not found');
  const balance = await computeWalletBalance(courierId);
  const tips = await prisma.transaction.aggregate({
    where: { courierId, type: 'tip' },
    _sum: { amount: true },
  });
  return {
    balance,
    tips: Math.round((tips._sum.amount ?? 0) * 100) / 100,
    rate: courier.rate,
    level: courier.level,
  };
}
