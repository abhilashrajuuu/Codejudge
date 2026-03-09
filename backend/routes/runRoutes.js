/**
 * routes/runRoutes.js — Code Execution Routes
 */

const express = require('express');
const router = express.Router();
const { runCode } = require('../controllers/runController');

/**
 * POST /api/run
 * Execute code via Judge0 API.
 * 
 * Body: { language: string, code: string, stdin?: string }
 */
router.post('/', runCode);

module.exports = router;
