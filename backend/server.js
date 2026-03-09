/**
 * server.js — CodeJudge Backend Entry Point
 *
 * Express server with CORS, rate limiting, MongoDB connection,
 * and all API routes mounted.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Auth middleware
const { protect, optionalAuth } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/authRoutes');
const runRoutes = require('./routes/runRoutes');
const programRoutes = require('./routes/programRoutes');
const executionRoutes = require('./routes/executionRoutes');
const debugRoutes = require('./routes/debugRoutes');

/* ========================================================================
   App Setup
   ======================================================================== */

const app = express();
const PORT = process.env.PORT || 5000;

/* ========================================================================
   Middleware
   ======================================================================== */

// CORS — allow frontend to communicate with backend
app.use(cors({
    origin: '*', // In production, restrict to your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON request bodies (limit to 1MB)
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Rate limiting — prevent abuse of code execution endpoint
const runLimiter = rateLimit({
    windowMs: 60 * 1000,   // 1 minute window
    max: 15,               // Max 15 requests per minute
    message: {
        error: 'Too many code execution requests. Please wait a moment and try again.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General rate limiter for all API routes
const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: {
        error: 'Too many requests. Please slow down.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api', generalLimiter);

// AI Debugger rate limiter (stricter — 5 requests per minute)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: {
        error: 'Too many AI requests. Please wait a moment.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/* ========================================================================
   Routes
   ======================================================================== */

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CodeJudge API',
        timestamp: new Date().toISOString(),
    });
});

// Authentication (public)
app.use('/api/auth', authRoutes);

// Code execution (optional auth — links history to user if logged in)
app.use('/api/run', runLimiter, optionalAuth, runRoutes);

// Saved programs (protected — requires login)
app.use('/api/programs', protect, programRoutes);

// Execution history (protected — requires login)
app.use('/api/executions', protect, executionRoutes);

// AI Debugger (with stricter rate limit)
app.use('/api/debug', aiLimiter, debugRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('[Server] Unhandled error:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

/* ========================================================================
   Start Server
   ======================================================================== */

const startServer = async () => {
    // Connect to MongoDB
    await connectDB();

    app.listen(PORT, () => {
        console.log('');
        console.log('  ⚡ CodeJudge API Server');
        console.log(`  ➜ Local:   http://localhost:${PORT}`);
        console.log(`  ➜ Health:  http://localhost:${PORT}/api/health`);
        console.log('');
    });
};

// Start server only when running locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    startServer();
}

// Export app for Vercel
module.exports = app;
