/**
 * config/db.js — MongoDB Connection
 * 
 * Establishes connection to MongoDB Atlas using Mongoose.
 * Connection URI is loaded from environment variables.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 */
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('[DB] MONGODB_URI is not defined in environment variables');
            return;
        }

        const conn = await mongoose.connect(uri);

        console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DB] Connection error: ${error.message}`);
        // Only exit process if running locally; on Vercel, let the platform handle it
        if (!process.env.VERCEL) {
            process.exit(1);
        }
    }
};

module.exports = connectDB;
