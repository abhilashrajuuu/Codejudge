/**
 * models/Program.js — Saved Program Schema
 * 
 * Represents a user's saved code snippet with metadata.
 */

const mongoose = require('mongoose');

const programSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        title: {
            type: String,
            required: [true, 'Program title is required'],
            trim: true,
            maxlength: [80, 'Title cannot exceed 80 characters'],
        },
        language: {
            type: String,
            required: [true, 'Language is required'],
            enum: {
                values: ['python', 'cpp', 'java', 'javascript'],
                message: '{VALUE} is not a supported language',
            },
        },
        code: {
            type: String,
            required: [true, 'Code content is required'],
            maxlength: [50000, 'Code cannot exceed 50,000 characters'],
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    }
);

// Index for efficient querying
programSchema.index({ created_at: -1 });

module.exports = mongoose.model('Program', programSchema);
