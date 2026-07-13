import { prisma } from '../src/config';
import bcrypt from 'bcryptjs';

export async function createTestCourier(suffix = '') {
  const passwordHash = await bcrypt.hash('password123', 10);
  const courier = await prisma.courier.create({
    data: {
      email: `test${suffix}@example.com`,
      passwordHash,
      workId: `#TEST${suffix || '1'}`,
      name: `Test Courier${suffix}`,
      team: 'Team A',
      transportationType: 'car',
      vehicleNumber: 'ABC-123',
      level: 3,
      rate: 25,
    },
  });
  return courier;
}

export async function createTestShift(courierId: string, status: 'active' | 'ended' = 'active') {
  const shift = await prisma.shift.create({
    data: {
      courierId,
      status,
      ...(status === 'ended' && {
        endedAt: new Date(),
        totalEarned: 50,
        totalTips: 10,
        deliveriesCompleted: 3,
      }),
    },
  });
  return shift;
}

export async function createTestOrder(
  courierId: string,
  shiftId: string,
  overrides: Partial<any> = {},
) {
  const order = await prisma.order.create({
    data: {
      orderCode: overrides.orderCode || `#403-${Math.floor(Math.random() * 1000)}`,
      status: overrides.status || 'assigned',
      pickupAddress: overrides.pickupAddress || '123 Pickup St',
      destinationAddress: overrides.destinationAddress || '456 Destination Ave',
      customerName: overrides.customerName || 'Jane Smith',
      customerPhone: overrides.customerPhone || '+1234567890',
      itemsJson: overrides.itemsJson || JSON.stringify([{ name: 'Pizza', price: 15.99, notes: '' }]),
      totalAmount: overrides.totalAmount ?? 18.99,
      paymentMethod: overrides.paymentMethod || 'credit_card',
      courierEarning: overrides.courierEarning ?? 4.50,
      tip: overrides.tip ?? 2.00,
      courierId,
      shiftId,
    },
  });
  return order;
}

export async function createTestTransaction(
  courierId: string,
  type: 'earning' | 'tip' | 'withdrawal',
  amount: number,
  relatedOrderId?: string,
) {
  return prisma.transaction.create({
    data: { courierId, type, amount, relatedOrderId },
  });
}
