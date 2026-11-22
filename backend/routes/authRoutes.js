// backend/routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Slow down credential stuffing and password-reset abuse independently of the
// broader API limiter. Limits are per client IP.
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many password reset requests. Try again later.' } });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many registration attempts. Try again later.' } });
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate, registerRules, loginRules } = require('../middleware/validationMiddleware');

router.post('/register', registerLimiter, registerRules, validate, authController.register);
router.post('/login', loginLimiter, loginRules, validate, authController.login);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', resetLimiter, authController.forgotPassword);
router.post('/reset-password', resetLimiter, authController.resetPassword);

module.exports = router;
