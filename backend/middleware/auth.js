/**
 * middleware/auth.js — JWT Authentication Middleware
 *
 * Verifies JWT token from Authorization header and attaches user to request.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Not authorized. Please log in.' });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'User not found. Please log in again.' });
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token. Please log in again.' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        }
        return res.status(500).json({ error: 'Authentication error.' });
    }
};

/**
 * Optional auth — attaches user if token present, but doesn't block.
 * Used for routes that work for both authenticated and anonymous users.
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (user) req.user = user;
        }
    } catch (err) {
        // Silently ignore invalid tokens for optional auth
    }
    next();
};

module.exports = { protect, optionalAuth };
