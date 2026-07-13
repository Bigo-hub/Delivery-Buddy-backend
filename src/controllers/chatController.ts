import { Response } from 'express';
import { prisma } from '../config';
import { AuthedRequest } from '../middleware/auth';
import { notFound } from '../middleware/error';

export async function getMessages(req: AuthedRequest, res: Response) {
  const { id: orderId } = req.params;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 50;
  const skip = (page - 1) * limit;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.courierId !== req.courierId) throw notFound('Order not found');

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.message.count({ where: { orderId } }),
  ]);

  res.json({
    messages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function createMessage(req: AuthedRequest, res: Response) {
  const { id: orderId } = req.params;
  const { text, senderType } = req.body;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.courierId !== req.courierId) throw notFound('Order not found');

  const message = await prisma.message.create({
    data: { orderId, senderType, text },
  });
  res.status(201).json({ message });
}
