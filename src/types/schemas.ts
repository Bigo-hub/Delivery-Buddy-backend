import { z } from 'zod';

export const transportationTypes = ['bicycle', 'car', 'truck'] as const;
export const orderStatuses = ['assigned', 'in_transit', 'at_door', 'delivered', 'cancelled'] as const;
export const paymentMethods = ['credit_card', 'cash', 'debit_card', 'wallet'] as const;
export const transactionTypes = ['earning', 'tip', 'withdrawal'] as const;

export const signupSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  workId: z.string().min(3, 'workId is required'),
  name: z.string().min(1, 'name is required'),
  team: z.string().optional(),
  transportationType: z.enum(transportationTypes, {
    errorMap: () => ({ message: 'transportationType must be bicycle, car, or truck' }),
  }),
  vehicleNumber: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'password is required'),
});

export const updateProfileSchema = z.object({
  workId: z.string().min(3).optional(),
  name: z.string().min(1).optional(),
  team: z.string().optional(),
  transportationType: z.enum(transportationTypes).optional(),
  vehicleNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateSettingsSchema = z.object({
  locationSettings: z.string().optional(),
  notificationSettings: z.string().optional(),
  billingMethod: z.string().optional(),
});

export const startShiftSchema = z.object({});

export const stopShiftSchema = z.object({});

export const idParamSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1, 'orderId is required'),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['in_transit', 'at_door', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'status must be one of: in_transit, at_door, delivered, cancelled' }),
  }),
});

export const ordersQuerySchema = z.object({
  status: z.enum(orderStatuses).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const shiftsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const withdrawSchema = z.object({
  amount: z.number().positive('amount must be positive'),
});

export const createMessageSchema = z.object({
  text: z.string().min(1, 'text is required').max(2000, 'text too long'),
  senderType: z.enum(['courier', 'customer']).optional().default('courier'),
});

export const messagesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const transactionsQuerySchema = z.object({
  type: z.enum(transactionTypes).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
