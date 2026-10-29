import rateLimit from 'express-rate-limit';

/**
 * Calculates remaining minutes until the rate limit window resets.
 */
const getRemainingMinutes = (req, defaultMinutes = 15) => {
  const resetTime = req.rateLimit?.resetTime;
  if (!resetTime) return defaultMinutes;
  const remainingMs = Math.max(0, resetTime.getTime() - Date.now());
  return Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
};

/**
 * Login rate limiter:
 * Limits failed login attempts to 10 per 15-minute window per IP.
 * Crucially, `skipSuccessfulRequests: true` ensures legitimate users
 * with the correct password never get locked out simply for logging in.
 * Computes remaining wait time dynamically instead of showing static text.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  skipSuccessfulRequests: true, // Only failed attempts (wrong password) consume quota
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => {
    const minutes = getRemainingMinutes(req, 15);
    return {
      message: `Too many failed login attempts, please try again ${minutes} minute${minutes === 1 ? '' : 's'} later.`,
    };
  },
});

/**
 * Registration rate limiter:
 * Limits account creation to 10 accounts per hour per IP
 * to prevent bot automated signups without interfering with login limits.
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => {
    const minutes = getRemainingMinutes(req, 60);
    return {
      message: `Too many accounts registered from this IP, please try again ${minutes} minute${minutes === 1 ? '' : 's'} later.`,
    };
  },
});

/**
 * Google exchange rate limiter:
 * Prevents brute-forcing of single-use Google auth exchange codes.
 */
export const googleExchangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: (req) => {
    const minutes = getRemainingMinutes(req, 15);
    return {
      message: `Too many Google authentication attempts, please try again ${minutes} minute${minutes === 1 ? '' : 's'} later.`,
    };
  },
});

// Backward-compatible alias
export const authLimiter = loginLimiter;
