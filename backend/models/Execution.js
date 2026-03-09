/**
 * models/Execution.js — Code Execution History Schema
 * 
 * Tracks each code execution with input, output, errors, and timing.
 */

const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        language: {
            type: String,
            required: true,
            enum: ['python', 'cpp', 'java', 'javascript'],
        },
        code: {
            type: String,
            required: true,
            maxlength: 50000,
        },
        stdin: {
            type: String,
            default: '',
            maxlength: 10000,
        },
        output: {
            type: String,
            default: '',
        },
        errors: {
            type: String,
            default: '',
        },
        execution_time: {
            type: String,
            default: null,
        },
        memory: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            default: 'unknown',
        },
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: false,
        },
    }
);

// Index for recent executions query
executionSchema.index({ created_at: -1 });

module.exports = mongoose.model('Execution', executionSchema);
