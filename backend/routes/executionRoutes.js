/**
 * routes/executionRoutes.js — Execution History Routes
 */

const express = require('express');
const router = express.Router();
const { getExecutions } = require('../controllers/executionController');

/**
 * GET /api/executions → Get execution history
 */
router.get('/', getExecutions);

module.exports = router;
