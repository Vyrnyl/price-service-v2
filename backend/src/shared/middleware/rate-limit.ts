import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import AppError from '../utils/AppError';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'unknown';
    return `${ipKeyGenerator(req.ip ?? 'unknown-ip')}:${email}`;
  },
  handler: (_req, _res, next) => {
    next(new AppError('Too many login attempts. Please try again in 15 minutes.', 429));
  },
});
