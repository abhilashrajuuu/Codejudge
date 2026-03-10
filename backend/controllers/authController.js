/**
 * controllers/authController.js — Authentication Controller
 *
 * Handles user registration, login, Google Sign-In, and profile retrieval.
 */

const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Generate JWT token.
 */
function generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
}

/**
 * Build user response object.
 */
function userResponse(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
    };
}

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Create user
        const user = await User.create({ name, email, password });

        // Generate token
        const token = generateToken(user._id);

        return res.status(201).json({
            token,
            user: userResponse(user),
        });
    } catch (err) {
        console.error('[Auth] Register Error:', {
            message: err.message,
            stack: err.stack,
            body: req.body
        });

        if (err.code === 11000) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ error: messages[0] });
        }

        return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Google-only users can't login with password
        if (!user.password) {
            return res.status(401).json({ error: 'This account uses Google Sign-In. Please use the Google button.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate token
        const token = generateToken(user._id);

        return res.json({
            token,
            user: userResponse(user),
        });
    } catch (err) {
        console.error('[Auth] Login Error:', {
            message: err.message,
            stack: err.stack,
            email: req.body?.email
        });
        return res.status(500).json({ error: 'Login failed. Please try again.' });
    }
};

/**
 * POST /api/auth/google
 * Verify Google ID token and create/login user.
 */
const googleAuth = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user exists with this Google ID or email
        let user = await User.findOne({
            $or: [{ googleId }, { email }],
        });

        if (user) {
            // Link Google account if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture || user.avatar;
                await user.save();
            }
        } else {
            // Create new user from Google profile
            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture,
            });
        }

        // Generate our JWT
        const token = generateToken(user._id);

        return res.json({
            token,
            user: userResponse(user),
        });
    } catch (err) {
        console.error('[Auth] Google error:', err.message);
        return res.status(401).json({ error: 'Google authentication failed. Please try again.' });
    }
};

/**
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
    return res.json({
        user: userResponse(req.user),
    });
};

module.exports = { register, login, googleAuth, getProfile };
