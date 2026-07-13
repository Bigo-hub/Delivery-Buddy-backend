import { Response } from 'express';
import { prisma } from '../config';
import { AuthedRequest } from '../middleware/auth';
import { HttpError, badRequest, conflict, notFound } from '../middleware/error';
import { getRoute } from '../services/routeCache';

function parseItems(itemsJson: string) {
  try {
    return JSON.parse(itemsJson);
  } catch {
    return [];
  }
}

export function serializeOrder(o: any) {
  return {
    id: o.id,
    orderCode: o.orderCode,
    status: o.status,
    pickupAddress: o.pickupAddress,
    destinationAddress: o.destinationAddress,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    items: parseItems(o.itemsJson),
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    courierEarning: o.courierEarning,
    tip: o.tip,
    etaMinutes: o.etaMinutes,
    distanceRemainingKm: o.distanceRemainingKm,
    shiftId: o.shiftId,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export async function getOrders(req: AuthedRequest, res: Response) {
  const status = req.query.status as string | undefined;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 20;
  const skip = (page - 1) * limit;

  const activeShift = await prisma.shift.findFirst({
    where: { courierId: req.courierId, status: 'active' },
  });

  const where: any = { courierId: req.courierId };
  if (status) where.status = status;
  if (activeShift) where.shiftId = activeShift.id;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders: orders.map(serializeOrder),
    activeShiftId: activeShift?.id ?? null,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getOrder(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.courierId !== req.courierId) throw notFound('Order not found');
  res.json({ order: serializeOrder(order) });
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  assigned: ['in_transit', 'cancelled'],
  in_transit: ['at_door', 'delivered', 'cancelled'],
  at_door: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export async function updateOrderStatus(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const { status: newStatus } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.courierId !== req.courierId) throw notFound('Order not found');

  const allowed = VALID_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    throw conflict(
      `Cannot transition order from ${order.status} to ${newStatus}`,
      { currentStatus: order.status, attemptedStatus: newStatus, allowedTransitions: allowed },
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: newStatus },
  });

  // If delivered, record earning + tip transactions
  if (newStatus === 'delivered') {
    await prisma.transaction.create({
      data: { courierId: req.courierId!, type: 'earning', amount: order.courierEarning, relatedOrderId: order.id },
    });
    if (order.tip > 0) {
      await prisma.transaction.create({
        data: { courierId: req.courierId!, type: 'tip', amount: order.tip, relatedOrderId: order.id },
      });
    }
    // Update shift totals
    if (order.shiftId) {
      const shiftOrders = await prisma.order.findMany({ where: { shiftId: order.shiftId } });
      await prisma.shift.update({
        where: { id: order.shiftId },
        data: {
          totalEarned: shiftOrders.reduce((s, o) => s + o.courierEarning, 0),
          totalTips: shiftOrders.reduce((s, o) => s + o.tip, 0),
          deliveriesCompleted: shiftOrders.filter((o) => o.status === 'delivered').length,
        },
      });
    }
  }

  res.json({ order: serializeOrder(updated) });
}

export async function getOrderRoute(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order || order.courierId !== req.courierId) throw notFound('Order not found');

  const route = await getRoute(order.pickupAddress, order.destinationAddress);

  // Persist latest ETA/distance onto the order for the live-tracking screen
  await prisma.order.update({
    where: { id },
    data: { etaMinutes: route.etaMinutes, distanceRemainingKm: route.distanceKm },
  });

  res.json({ route });
}
