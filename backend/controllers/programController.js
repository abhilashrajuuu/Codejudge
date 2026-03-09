/**
 * controllers/programController.js — CRUD for Saved Programs
 *
 * Handles creating, reading, updating, and deleting saved programs.
 * All operations are scoped to the authenticated user.
 */

const Program = require('../models/Program');

/**
 * POST /api/programs
 * Create a new saved program.
 */
const createProgram = async (req, res) => {
    try {
        const { title, language, code } = req.body;

        if (!title || !language || !code) {
            return res.status(400).json({ error: 'Title, language, and code are required' });
        }

        const program = await Program.create({
            title,
            language,
            code,
            user: req.user._id,
        });
        return res.status(201).json(program);
    } catch (error) {
        console.error('[Program] Create error:', error.message);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }

        return res.status(500).json({ error: 'Failed to save program' });
    }
};

/**
 * GET /api/programs
 * Get all saved programs for the authenticated user.
 */
const getAllPrograms = async (req, res) => {
    try {
        const programs = await Program.find({ user: req.user._id })
            .sort({ created_at: -1 })
            .select('title language code created_at updated_at')
            .lean();

        return res.json(programs);
    } catch (error) {
        console.error('[Program] GetAll error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch programs' });
    }
};

/**
 * GET /api/programs/:id
 * Get a single program by ID (must belong to user).
 */
const getProgram = async (req, res) => {
    try {
        const program = await Program.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).lean();

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        return res.json(program);
    } catch (error) {
        console.error('[Program] Get error:', error.message);

        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid program ID' });
        }

        return res.status(500).json({ error: 'Failed to fetch program' });
    }
};

/**
 * PUT /api/programs/:id
 * Update an existing program (must belong to user).
 */
const updateProgram = async (req, res) => {
    try {
        const { title, language, code } = req.body;

        const program = await Program.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { title, language, code },
            { new: true, runValidators: true }
        );

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        return res.json(program);
    } catch (error) {
        console.error('[Program] Update error:', error.message);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }

        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid program ID' });
        }

        return res.status(500).json({ error: 'Failed to update program' });
    }
};

/**
 * DELETE /api/programs/:id
 * Delete a saved program (must belong to user).
 */
const deleteProgram = async (req, res) => {
    try {
        const program = await Program.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!program) {
            return res.status(404).json({ error: 'Program not found' });
        }

        return res.json({ message: 'Program deleted successfully' });
    } catch (error) {
        console.error('[Program] Delete error:', error.message);

        if (error.kind === 'ObjectId') {
            return res.status(400).json({ error: 'Invalid program ID' });
        }

        return res.status(500).json({ error: 'Failed to delete program' });
    }
};

module.exports = {
    createProgram,
    getAllPrograms,
    getProgram,
    updateProgram,
    deleteProgram,
};
