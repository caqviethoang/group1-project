// middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const Log = require('../models/Log');

// Rate limiting cho login - chống brute force
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5, // Tối đa 5 lần login failed
  message: {
    success: false,
    message: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
  },
  handler: (req, res, next, options) => {
    const ipAddress = req.ip;
    
    // Ghi log brute force attempt
    Log.logActivity(
      null,
      'login_bruteforce_blocked',
      ipAddress,
      req.get('User-Agent') || '',
      {
        email: req.body.email,
        reason: 'Rate limit exceeded',
        attempts: options.attempts
      }
    ).catch(console.error);
    
    res.status(429).json(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting chung cho API
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests mỗi 15 phút
  message: {
    success: false,
    message: 'Quá nhiều requests. Vui lòng thử lại sau 15 phút.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginRateLimiter, apiRateLimiter };