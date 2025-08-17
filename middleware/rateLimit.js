const rateLimit = require('express-rate-limit');

// Limita a 5 intentos por IP cada 15 minutos en el endpoint de login
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión, intenta de nuevo más tarde.',
  },
  standardHeaders: true, // devuelve RateLimit-* headers
  legacyHeaders: false,  // deshabilita X-RateLimit-* headers
});

// Limita a 10 intentos por IP cada minuto en el endpoint de refresh-token
const refreshTokenRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de refresh token, intenta de nuevo más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginRateLimiter, refreshTokenRateLimiter };
