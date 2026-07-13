import { Response } from 'express';
import { prisma } from '../config';
import { AuthedRequest } from '../middleware/auth';
import { HttpError, conflict, notFound } from '../middleware/error';

export async function startShift(req: AuthedRequest, res: Response) {
  const active = await prisma.shift.findFirst({
    where: { courierId: req.courierId, status: 'active' },
  });
  if (active) throw conflict('A shift is already active. Stop it before starting a new one.');

  const shift = await prisma.shift.create({
    data: { courierId: req.courierId!, status: 'active' },
  });
  res.status(201).json({ shift });
}

export async function stopShift(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const shift = await prisma.shift.findUnique({ where: { id } });
  if (!shift) throw notFound('Shift not found');
  if (shift.courierId !== req.courierId) throw notFound('Shift not found');
  if (shift.status === 'ended') throw conflict('Shift is already ended');

  const orders = await prisma.order.findMany({
    where: { shiftId: id },
  });
  const totalEarned = orders.reduce((s, o) => s + o.courierEarning, 0);
  const totalTips = orders.reduce((s, o) => s + o.tip, 0);
  const deliveriesCompleted = orders.filter((o) => o.status === 'delivered').length;

  const updated = await prisma.shift.update({
    where: { id },
    data: {
      status: 'ended',
      endedAt: new Date(),
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalTips: Math.round(totalTips * 100) / 100,
      deliveriesCompleted,
    },
  });
  res.json({ shift: updated });
}

export async function getCurrentShift(req: AuthedRequest, res: Response) {
  const shift = await prisma.shift.findFirst({
    where: { courierId: req.courierId, status: 'active' },
    orderBy: { startedAt: 'desc' },
    include: {
      orders: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!shift) throw notFound('No active shift');
  res.json({ shift });
}

export async function getShiftHistory(req: AuthedRequest, res: Response) {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const skip = (page - 1) * limit;

  const [shifts, total] = await Promise.all([
    prisma.shift.findMany({
      where: { courierId: req.courierId, status: 'ended' },
      orderBy: { startedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.shift.count({ where: { courierId: req.courierId, status: 'ended' } }),
  ]);

  res.json({
    shifts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
