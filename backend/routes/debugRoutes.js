/**
 * routes/debugRoutes.js — AI Debugger Routes
 */

const express = require('express');
const router = express.Router();
const { debugCode, fixMyCode } = require('../controllers/debugController');

/**
 * POST /api/debug — Analyze error and suggest fix
 * Body: { language, code, error }
 */
router.post('/', debugCode);

/**
 * POST /api/fix — Optimize/fix entire code
 * Body: { language, code }
 */
router.post('/fix', fixMyCode);

module.exports = router;
