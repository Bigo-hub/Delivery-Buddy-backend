import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config';

export interface AuthedRequest extends Request {
  courierId?: string;
  courier?: any;
}

export function signToken(courierId: string): string {
  return jwt.sign({ sub: courierId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as any,
  });
}

export async function authMiddleware(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header' });
    }
    const token = header.slice(7);
    let payload: any;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const courierId = payload.sub;
    const courier = await prisma.courier.findUnique({ where: { id: courierId } });
    if (!courier) {
      return res.status(401).json({ error: 'Courier no longer exists' });
    }
    req.courierId = courierId;
    req.courier = courier;
    next();
  } catch (err) {
    next(err);
  }
}
