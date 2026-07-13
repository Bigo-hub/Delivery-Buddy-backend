import { Response } from 'express';
import { prisma } from '../config';
import { AuthedRequest } from '../middleware/auth';
import { HttpError, badRequest, notFound } from '../middleware/error';
import { getWalletSummary, computeWalletBalance } from '../services/wallet';

export async function getWallet(req: AuthedRequest, res: Response) {
  const summary = await getWalletSummary(req.courierId!);
  res.json({ wallet: summary });
}

export async function getTransactions(req: AuthedRequest, res: Response) {
  const type = req.query.type as string | undefined;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const skip = (page - 1) * limit;

  const where: any = { courierId: req.courierId };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    transactions,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function withdraw(req: AuthedRequest, res: Response) {
  const { amount } = req.body;
  const balance = await computeWalletBalance(req.courierId!);

  if (amount > balance) {
    throw badRequest('Insufficient balance for this withdrawal', { balance, requested: amount });
  }

  // Create withdrawal record + ledger transaction atomically
  const withdrawal = await prisma.walletWithdrawal.create({
    data: { courierId: req.courierId!, amount, status: 'completed' },
  });

  await prisma.transaction.create({
    data: { courierId: req.courierId!, type: 'withdrawal', amount },
  });

  const newBalance = Math.round((balance - amount) * 100) / 100;
  res.status(201).json({ withdrawal, newBalance });
}
