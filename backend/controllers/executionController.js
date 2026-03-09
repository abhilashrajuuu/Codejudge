/**
 * controllers/executionController.js — Execution History Controller
 *
 * Retrieves execution history records scoped to the authenticated user.
 */

const Execution = require('../models/Execution');

/**
 * GET /api/executions
 * Get all execution history records for the authenticated user.
 * Limits to the last 50 executions by default.
 */
const getExecutions = async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        const executions = await Execution.find({ user: req.user._id })
            .sort({ created_at: -1 })
            .limit(limit)
            .lean();

        return res.json(executions);
    } catch (error) {
        console.error('[Execution] GetAll error:', error.message);
        return res.status(500).json({ error: 'Failed to fetch execution history' });
    }
};

module.exports = { getExecutions };
