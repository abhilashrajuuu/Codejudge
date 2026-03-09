/**
 * config/db.js — MongoDB Connection
 * 
 * Establishes connection to MongoDB Atlas using Mongoose.
 * Connection URI is loaded from environment variables.
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Atlas.
 * Exits the process on connection failure.
 */
const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('[DB] MONGODB_URI is not defined in environment variables');
            process.exit(1);
        }

        const conn = await mongoose.connect(uri);

        console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[DB] Connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
