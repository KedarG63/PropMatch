import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from './firebase';

export interface AuthRequest extends Request {
  uid?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing auth token' });
    return;
  }
  try {
    const token = header.slice(7);
    const decoded = await adminAuth.verifyIdToken(token);
    req.uid = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid auth token' });
  }
}
