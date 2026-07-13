import { Response } from 'express';
import { prisma } from '../config';
import { AuthedRequest } from '../middleware/auth';
import { HttpError, notFound } from '../middleware/error';
import { serializeCourier } from './authController';

export async function getMe(req: AuthedRequest, res: Response) {
  res.json({ courier: serializeCourier(req.courier) });
}

export async function updateProfile(req: AuthedRequest, res: Response) {
  const { workId, name, team, transportationType, vehicleNumber, avatarUrl } = req.body;

  if (workId && workId !== req.courier.workId) {
    const clash = await prisma.courier.findUnique({ where: { workId } });
    if (clash) throw new HttpError(409, 'workId already taken');
  }

  const updated = await prisma.courier.update({
    where: { id: req.courierId },
    data: {
      ...(workId !== undefined && { workId }),
      ...(name !== undefined && { name }),
      ...(team !== undefined && { team }),
      ...(transportationType !== undefined && { transportationType }),
      ...(vehicleNumber !== undefined && { vehicleNumber }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    },
  });
  res.json({ courier: serializeCourier(updated) });
}

export async function updateSettings(req: AuthedRequest, res: Response) {
  const { locationSettings, notificationSettings, billingMethod } = req.body;
  const updated = await prisma.courier.update({
    where: { id: req.courierId },
    data: {
      ...(locationSettings !== undefined && { locationSettings }),
      ...(notificationSettings !== undefined && { notificationSettings }),
      ...(billingMethod !== undefined && { billingMethod }),
    },
  });
  res.json({ courier: serializeCourier(updated) });
}
