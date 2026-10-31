import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db';

export const JWT_SECRET = process.env.JWT_SECRET || 'sgh_secure_jwt_secret_dev_local_mysql_2026';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore invalid token in optional mode
    }
  }
  next();
}

/**
 * Strict database-level admin check.
 * Never trusts the token's role alone; verifies current status directly in user_roles and profiles tables.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const adminCheck = await query<any[]>(
      `SELECT 1 FROM user_roles WHERE user_id = ? AND role = 'admin'
       UNION
       SELECT 1 FROM profiles WHERE id = ? AND role = 'admin'`,
      [req.user.id, req.user.id]
    );

    if (!adminCheck || adminCheck.length === 0) {
      return res.status(403).json({
        error: 'Access denied: Administrator privileges required',
        isUnauthorizedRole: true,
      });
    }

    next();
  } catch (err: any) {
    console.error('requireAdmin check error:', err);
    return res.status(500).json({ error: 'Failed to verify administrative authorization' });
  }
}
