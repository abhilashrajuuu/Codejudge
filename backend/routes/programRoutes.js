/**
 * routes/programRoutes.js — Saved Programs Routes
 */

const express = require('express');
const router = express.Router();
const {
    createProgram,
    getAllPrograms,
    getProgram,
    updateProgram,
    deleteProgram,
} = require('../controllers/programController');

/**
 * POST   /api/programs      → Create new program
 * GET    /api/programs      → Get all programs
 * GET    /api/programs/:id  → Get single program
 * PUT    /api/programs/:id  → Update program
 * DELETE /api/programs/:id  → Delete program
 */
router.post('/', createProgram);
router.get('/', getAllPrograms);
router.get('/:id', getProgram);
router.put('/:id', updateProgram);
router.delete('/:id', deleteProgram);

module.exports = router;
