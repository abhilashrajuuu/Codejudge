/**
 * controllers/debugController.js — AI Debugger Controller
 *
 * Uses Groq API (fast, free) to analyze compiler errors, explain issues,
 * and provide corrected code. Also supports "Fix My Code" for optimization.
 */

const axios = require('axios');

/* ========================================================================
   Groq AI Setup
   ======================================================================== */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Call Groq API with retry logic for rate limits.
 */
async function callGroq(systemPrompt, userPrompt, maxRetries = 3) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error('GROQ_API_KEY is not set in environment variables');
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await axios.post(GROQ_API_URL, {
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 2048,
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 30000,
            });

            return response.data.choices[0].message.content.trim();
        } catch (err) {
            const status = err.response?.status;
            const isRateLimit = status === 429 || status === 503;

            if (isRateLimit && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt + 1) * 1000;
                console.log(`[AI] Rate limited, retrying in ${delay / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                const errMsg = err.response?.data?.error?.message || err.message;
                console.error(`[AI] Groq API error: ${errMsg}`);
                throw new Error(errMsg);
            }
        }
    }
}

/* ========================================================================
   Simple Response Cache
   ======================================================================== */

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(language, code, error) {
    return `${language}|${code.trim().substring(0, 200)}|${(error || '').trim().substring(0, 200)}`;
}

function getCached(key) {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
    if (entry) cache.delete(key);
    return null;
}

function setCache(key, data) {
    if (cache.size > 100) {
        const oldest = cache.keys().next().value;
        cache.delete(oldest);
    }
    cache.set(key, { data, timestamp: Date.now() });
}

/* ========================================================================
   Error Categorization
   ======================================================================== */

function categorizeError(errorText) {
    const lower = errorText.toLowerCase();
    if (lower.includes('syntaxerror') || lower.includes('syntax error') || lower.includes('unexpected token') || lower.includes('expected') || lower.includes('eol while scanning')) {
        return 'Syntax Error';
    }
    if (lower.includes('runtimeerror') || lower.includes('runtime error') || lower.includes('segmentation fault') || lower.includes('exception in thread')) {
        return 'Runtime Error';
    }
    if (lower.includes('compilation') || lower.includes('compile error') || lower.includes('cannot find symbol')) {
        return 'Compilation Error';
    }
    if (lower.includes('indexerror') || lower.includes('typeerror') || lower.includes('keyerror') || lower.includes('attributeerror') || lower.includes('valueerror') || lower.includes('nameerror') || lower.includes('zerodivisionerror')) {
        return 'Runtime Error';
    }
    if (lower.includes('nullpointerexception') || lower.includes('arrayindexoutofbounds') || lower.includes('classnotfound')) {
        return 'Runtime Error';
    }
    return 'Error';
}

/* ========================================================================
   Debug Code — Analyze Error & Suggest Fix
   ======================================================================== */

const SYSTEM_PROMPT = `You are an expert programming debugger. When given code and an error, you analyze the issue and provide a fix.

IMPORTANT: Always respond with ONLY valid JSON, no markdown, no code fences, just raw JSON in this exact format:
{
  "explanation": "Clear explanation of what went wrong (2-3 sentences)",
  "fixed_code": "The complete corrected version of the code"
}`;

/**
 * POST /api/debug
 */
const debugCode = async (req, res) => {
    try {
        const { language, code, error } = req.body;

        if (!language || !code || !error) {
            return res.status(400).json({ error: 'Language, code, and error are required' });
        }

        if (code.length > 5000) {
            return res.status(400).json({ error: 'Code exceeds maximum length of 5000 characters' });
        }

        // Check cache
        const cacheKey = getCacheKey(language, code, error);
        const cached = getCached(cacheKey);
        if (cached) return res.json(cached);

        const errorType = categorizeError(error);

        const userPrompt = `Language: ${language}

Code:
\`\`\`
${code}
\`\`\`

Compiler/Runtime Error:
${error}

Error Type: ${errorType}

Analyze this error and provide the corrected code.`;

        const responseText = await callGroq(SYSTEM_PROMPT, userPrompt);

        // Parse AI response
        let parsed;
        try {
            let cleaned = responseText;
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
            }
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[Debug] Failed to parse AI response:', responseText.substring(0, 200));
            parsed = {
                explanation: responseText.substring(0, 500),
                fixed_code: code,
            };
        }

        const response = {
            explanation: parsed.explanation || 'Unable to analyze the error.',
            fixed_code: parsed.fixed_code || code,
            error_type: errorType,
        };

        setCache(cacheKey, response);
        return res.json(response);

    } catch (err) {
        console.error('[Debug] Error:', err.message);

        if (err.message.includes('GROQ_API_KEY')) {
            return res.status(500).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' });
        }

        return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
    }
};

/* ========================================================================
   Fix My Code — Optimize & Improve Code
   ======================================================================== */

const FIX_SYSTEM_PROMPT = `You are an expert programmer. When given code, you review it, fix bugs, improve readability, and follow best practices.

IMPORTANT: Always respond with ONLY valid JSON, no markdown, no code fences, just raw JSON in this exact format:
{
  "explanation": "Brief summary of what you fixed or improved (2-3 sentences)",
  "fixed_code": "The complete improved version of the code"
}`;

/**
 * POST /api/fix
 */
const fixMyCode = async (req, res) => {
    try {
        const { language, code } = req.body;

        if (!language || !code) {
            return res.status(400).json({ error: 'Language and code are required' });
        }

        if (code.length > 5000) {
            return res.status(400).json({ error: 'Code exceeds maximum length of 5000 characters' });
        }

        const userPrompt = `Language: ${language}

Code:
\`\`\`
${code}
\`\`\`

Review, fix, and optimize this code.`;

        const responseText = await callGroq(FIX_SYSTEM_PROMPT, userPrompt);

        let parsed;
        try {
            let cleaned = responseText;
            if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
            }
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error('[Fix] Failed to parse AI response:', responseText.substring(0, 200));
            parsed = {
                explanation: responseText.substring(0, 500),
                fixed_code: code,
            };
        }

        return res.json({
            explanation: parsed.explanation || 'Code reviewed.',
            fixed_code: parsed.fixed_code || code,
        });

    } catch (err) {
        console.error('[Fix] Error:', err.message);
        return res.status(500).json({ error: 'AI analysis failed. Please try again.' });
    }
};

module.exports = { debugCode, fixMyCode };
