/**
 * controllers/runController.js — Code Execution Controller
 * 
 * Submits code to Judge0 API, polls for result, saves execution
 * history, and returns the output to the client.
 */

const axios = require('axios');
const Execution = require('../models/Execution');

/* ========================================================================
   Language → Judge0 Language ID Mapping
   ======================================================================== */

const LANGUAGE_MAP = {
    python: 71,  // Python 3.8.1
    cpp: 54,  // C++ (GCC 9.2.0)
    java: 62,  // Java (OpenJDK 13.0.1)
    javascript: 63,  // JavaScript (Node.js 12.14.0)
};

/* ========================================================================
   Judge0 API Config
   ======================================================================== */

const getJudge0Config = () => {
    const apiKey = process.env.JUDGE0_API_KEY;
    const baseURL = process.env.JUDGE0_API_URL || 'https://ce.judge0.com';

    // If RapidAPI key is provided, use RapidAPI headers
    // Otherwise, use the free public Judge0 instance (no auth needed)
    const headers = apiKey
        ? {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com',
        }
        : {
            'Content-Type': 'application/json',
        };

    return { baseURL, headers };
};

/* ========================================================================
   Run Code Handler
   ======================================================================== */

/**
 * POST /api/run
 * 
 * Request body:
 *   { language: string, code: string, stdin?: string }
 * 
 * Response:
 *   { output: string, error: string, time: string, memory: string, status: string }
 */
const runCode = async (req, res) => {
    try {
        const { language, code, stdin = '' } = req.body;

        // ---- Validation ----
        if (!language || !code) {
            return res.status(400).json({
                error: 'Language and code are required',
            });
        }

        const languageId = LANGUAGE_MAP[language];
        if (!languageId) {
            return res.status(400).json({
                error: `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(', ')}`,
            });
        }

        // ---- Submit to Judge0 ----
        const config = getJudge0Config();

        const submissionResponse = await axios.post(
            `${config.baseURL}/submissions?base64_encoded=true&wait=false`,
            {
                language_id: languageId,
                source_code: Buffer.from(code).toString('base64'),
                stdin: Buffer.from(stdin).toString('base64'),
                cpu_time_limit: 2,     // 2 seconds
                memory_limit: 128000, // 128 MB
            },
            { headers: config.headers }
        );

        const { token } = submissionResponse.data;

        if (!token) {
            return res.status(500).json({ error: 'Failed to create submission (no token received)' });
        }

        // ---- Poll for Result ----
        const result = await pollSubmission(token, config);

        // ---- Decode Base64 output ----
        const output = result.stdout
            ? Buffer.from(result.stdout, 'base64').toString('utf-8')
            : '';

        const compileError = result.compile_output
            ? Buffer.from(result.compile_output, 'base64').toString('utf-8')
            : '';

        const stderrOutput = result.stderr
            ? Buffer.from(result.stderr, 'base64').toString('utf-8')
            : '';

        // Combine errors
        const errorText = [compileError, stderrOutput].filter(Boolean).join('\n').trim();

        const statusDesc = result.status?.description || 'Unknown';
        const execTime = result.time ? `${result.time}s` : null;
        const execMemory = result.memory ? `${(result.memory / 1024).toFixed(1)} MB` : null;

        // ---- Save to execution history ----
        try {
            await Execution.create({
                language,
                code,
                stdin,
                output,
                errors: errorText,
                execution_time: execTime,
                memory: execMemory,
                status: statusDesc,
                user: req.user ? req.user._id : null,
            });
        } catch (saveErr) {
            console.warn('[Run] Failed to save execution history:', saveErr.message);
        }

        // ---- Return result ----
        return res.json({
            output,
            error: errorText,
            time: execTime,
            memory: execMemory,
            status: statusDesc,
        });

    } catch (error) {
        console.error('[Run] Error:', error.response?.data || error.message);

        // If it's a Judge0 API error, surface it
        if (error.response?.status === 422) {
            return res.status(422).json({
                error: 'Invalid submission. Please check your code and try again.',
            });
        }

        return res.status(500).json({
            error: 'Internal server error. Please try again later.',
        });
    }
};

/* ========================================================================
   Polling Helper
   ======================================================================== */

/**
 * Poll Judge0 API for submission result until it's done.
 * @param {string} token - Submission token
 * @param {object} config - Judge0 API config
 * @param {number} maxAttempts - Maximum polling attempts
 * @param {number} interval - Polling interval in ms
 * @returns {Promise<object>} - The submission result
 */
async function pollSubmission(token, config, maxAttempts = 20, interval = 1000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await sleep(interval);

        const response = await axios.get(
            `${config.baseURL}/submissions/${token}?base64_encoded=true`,
            { headers: config.headers }
        );

        const { status } = response.data;

        // Status IDs: 1 = In Queue, 2 = Processing
        if (status && status.id > 2) {
            return response.data;
        }
    }

    throw new Error('Submission timed out after maximum polling attempts');
}

/**
 * Sleep helper.
 * @param {number} ms
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { runCode };
