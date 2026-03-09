/**
 * routes/authRoutes.js — Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

/**
 * POST /api/auth/register — Create new account
 */
router.post('/register', register);

/**
 * POST /api/auth/login — Login with email/password
 */
router.post('/login', login);

/**
 * POST /api/auth/google — Sign in with Google
 */
router.post('/google', googleAuth);

/**
 * GET /api/auth/profile — Get current user (protected)
 */
router.get('/profile', protect, getProfile);

module.exports = router;
