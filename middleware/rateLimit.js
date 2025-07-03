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

module.exports = { loginRateLimiter };
