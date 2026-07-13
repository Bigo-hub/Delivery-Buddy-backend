import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config';
import { AuthedRequest, signToken } from '../middleware/auth';
import { HttpError, badRequest } from '../middleware/error';

export async function signup(req: AuthedRequest, res: Response) {
  const { email, password, workId, name, team, transportationType, vehicleNumber } = req.body;

  const existing = await prisma.courier.findFirst({
    where: { OR: [{ email }, { workId }] },
  });
  if (existing) {
    throw badRequest('A courier with this email or workId already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const courier = await prisma.courier.create({
    data: { email, passwordHash, workId, name, team, transportationType, vehicleNumber },
  });

  const token = signToken(courier.id);
  res.status(201).json({
    token,
    courier: serializeCourier(courier),
  });
}

export async function login(req: AuthedRequest, res: Response) {
  const { email, password } = req.body;
  const courier = await prisma.courier.findUnique({ where: { email } });
  if (!courier) throw new HttpError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, courier.passwordHash);
  if (!valid) throw new HttpError(401, 'Invalid email or password');

  const token = signToken(courier.id);
  res.json({ token, courier: serializeCourier(courier) });
}

export async function logout(_req: AuthedRequest, res: Response) {
  // Stateless JWT: the client discards the token. We return 200 for symmetry.
  res.json({ message: 'Logged out' });
}

export function serializeCourier(c: any) {
  return {
    id: c.id,
    workId: c.workId,
    name: c.name,
    email: c.email,
    avatarUrl: c.avatarUrl,
    team: c.team,
    level: c.level,
    rate: c.rate,
    transportationType: c.transportationType,
    vehicleNumber: c.vehicleNumber,
    locationSettings: c.locationSettings,
    notificationSettings: c.notificationSettings,
    billingMethod: c.billingMethod,
    createdAt: c.createdAt,
  };
}
