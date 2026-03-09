/**
 * script.js — CodeJudge Application Logic
 * 
 * Handles: Run Code, Save/Load/Delete Programs,
 * Execution History, Tab Navigation, and UI interactions.
 */

/* ========================================================================
   Configuration
   ======================================================================== */

const API_BASE = '/api';

/* ========================================================================
   DOM References
   ======================================================================== */

const dom = {
    // Navbar
    languageSelect: document.getElementById('language-select'),
    runBtn: document.getElementById('run-btn'),
    saveBtn: document.getElementById('save-btn'),
    stdinToggleBtn: document.getElementById('stdin-toggle-btn'),

    // Tabs
    tabEditor: document.getElementById('tab-editor'),
    tabPrograms: document.getElementById('tab-programs'),
    tabHistory: document.getElementById('tab-history'),

    // Views
    viewEditor: document.getElementById('view-editor'),
    viewPrograms: document.getElementById('view-programs'),
    viewHistory: document.getElementById('view-history'),

    // Editor
    editorFilename: document.getElementById('editor-filename'),
    stdinPanel: document.getElementById('stdin-panel'),
    stdinInput: document.getElementById('stdin-input'),

    // Output
    outputConsole: document.getElementById('output-console'),
    outputPlaceholder: document.getElementById('output-placeholder'),
    outputText: document.getElementById('output-text'),
    clearOutputBtn: document.getElementById('clear-output-btn'),
    execStats: document.getElementById('exec-stats'),
    statStatus: document.getElementById('stat-status'),
    statTime: document.getElementById('stat-time'),
    statMemory: document.getElementById('stat-memory'),

    // Programs
    programsGrid: document.getElementById('programs-grid'),
    programsEmpty: document.getElementById('programs-empty'),

    // History
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),

    // Save Modal
    saveModal: document.getElementById('save-modal'),
    programTitleInput: document.getElementById('program-title-input'),
    modalCloseBtn: document.getElementById('modal-close-btn'),
    modalCancelBtn: document.getElementById('modal-cancel-btn'),
    modalSaveBtn: document.getElementById('modal-save-btn'),

    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Resizer
    splitResizer: document.getElementById('split-resizer'),

    // AI Debugger Chatbot
    chatbot: document.getElementById('chatbot'),
    chatbotMessages: document.getElementById('chatbot-messages'),
    chatbotCloseBtn: document.getElementById('chatbot-close-btn'),
    fixMyCodeBtn: document.getElementById('fix-my-code-btn'),

    // Auth
    loginBtn: document.getElementById('login-btn'),
    userBadge: document.getElementById('user-badge'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    logoutBtn: document.getElementById('logout-btn'),
    authModal: document.getElementById('auth-modal'),
    authModalTitle: document.getElementById('auth-modal-title'),
    authModalCloseBtn: document.getElementById('auth-modal-close-btn'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    registerName: document.getElementById('register-name'),
    registerEmail: document.getElementById('register-email'),
    registerPassword: document.getElementById('register-password'),
    registerSubmitBtn: document.getElementById('register-submit-btn'),
    switchToRegister: document.getElementById('switch-to-register'),
    switchToLogin: document.getElementById('switch-to-login'),
    authError: document.getElementById('auth-error'),
    googleSignInBtn: document.getElementById('google-signin-btn'),

    // Landing Page
    landingPage: document.getElementById('landing-page'),
    appContainer: document.getElementById('app-container'),
    landingGoogleBtn: document.getElementById('landing-google-btn'),
    landingLoginBtn: document.getElementById('landing-login-btn'),
    landingRegisterBtn: document.getElementById('landing-register-btn'),
};

/* ========================================================================
   Initialization
   ======================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Monaco Editor (defined in editor.js)
    initEditor();

    // Bind event listeners
    bindEvents();

    // Initialize auth state
    initAuth();

    console.log('[App] CodeJudge initialized');
});

/* ========================================================================
   Event Bindings
   ======================================================================== */

function bindEvents() {
    // Language switching
    dom.languageSelect.addEventListener('change', (e) => {
        switchLanguage(e.target.value);
    });

    // Run code
    dom.runBtn.addEventListener('click', handleRunCode);

    // Save program
    dom.saveBtn.addEventListener('click', () => openSaveModal());

    // Stdin toggle
    dom.stdinToggleBtn.addEventListener('click', toggleStdin);

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Clear output
    dom.clearOutputBtn.addEventListener('click', clearOutput);

    // Modal
    dom.modalCloseBtn.addEventListener('click', closeSaveModal);
    dom.modalCancelBtn.addEventListener('click', closeSaveModal);
    dom.modalSaveBtn.addEventListener('click', handleSaveProgram);
    dom.saveModal.addEventListener('click', (e) => {
        if (e.target === dom.saveModal) closeSaveModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter → Run code
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleRunCode();
        }
        // Ctrl+S → Save program
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            openSaveModal();
        }
        // Escape → Close modal
        if (e.key === 'Escape') closeSaveModal();
    });

    // Split pane resizer
    initResizer();

    // AI Debugger
    dom.chatbotCloseBtn.addEventListener('click', closeChatbot);
    dom.fixMyCodeBtn.addEventListener('click', handleFixMyCode);

    // Auth
    dom.loginBtn.addEventListener('click', () => openAuthModal('login'));
    dom.logoutBtn.addEventListener('click', handleLogout);
    dom.authModalCloseBtn.addEventListener('click', closeAuthModal);
    dom.authModal.addEventListener('click', (e) => {
        if (e.target === dom.authModal) closeAuthModal();
    });
    dom.switchToRegister.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('register'); });
    dom.switchToLogin.addEventListener('click', (e) => { e.preventDefault(); openAuthModal('login'); });
    dom.loginForm.addEventListener('submit', handleLogin);
    dom.registerForm.addEventListener('submit', handleRegister);
    dom.googleSignInBtn.addEventListener('click', handleGoogleSignIn);

    // Landing Page Events
    dom.landingGoogleBtn.addEventListener('click', handleGoogleSignIn);
    dom.landingLoginBtn.addEventListener('click', () => openAuthModal('login'));
    dom.landingRegisterBtn.addEventListener('click', () => openAuthModal('register'));
}

/* ========================================================================
   Tab Navigation
   ======================================================================== */

/**
 * Switch between Editor, Saved Programs, and History views.
 * @param {'editor' | 'programs' | 'history'} tabName
 */
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.classList.toggle('tab-btn--active', btn.dataset.tab === tabName);
    });

    // Update views
    document.querySelectorAll('.view').forEach((view) => {
        view.classList.remove('view--active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.add('view--active');

    // Load data for the target tab
    if (tabName === 'programs') loadPrograms();
    if (tabName === 'history') loadHistory();
}

/* ========================================================================
   Run Code
   ======================================================================== */

let isRunning = false;

async function handleRunCode() {
    if (isRunning) return;

    const code = getEditorCode();
    const language = getCurrentLanguage();
    const stdin = dom.stdinInput ? dom.stdinInput.value : '';

    if (!code.trim()) {
        showToast('Please write some code first!', 'error');
        return;
    }

    isRunning = true;
    setRunButtonLoading(true);
    showOutput('⏳ Running your code...', 'info');

    try {
        const response = await axios.post(`${API_BASE}/run`, {
            language,
            code,
            stdin,
        }, { headers: getAuthHeaders() });

        const { output, error, time, memory, status } = response.data;

        // Display output
        if (error) {
            showOutput(error, 'error');
            // AUTO-TRIGGER AI DEBUGGER on errors
            autoDebugError(code, language, error);
        } else if (output) {
            showOutput(output, 'success');
        } else {
            showOutput('Program executed successfully (no output)', 'success');
        }

        // Show execution stats
        showExecStats(status, time, memory);

    } catch (err) {
        const message = err.response?.data?.error || err.message || 'Failed to run code';
        showOutput(`❌ Error: ${message}`, 'error');
        console.error('[Run]', err);
    } finally {
        isRunning = false;
        setRunButtonLoading(false);
    }
}

function setRunButtonLoading(loading) {
    if (loading) {
        dom.runBtn.disabled = true;
        dom.runBtn.innerHTML = '<span class="spinner"></span><span>Running...</span>';
    } else {
        dom.runBtn.disabled = false;
        dom.runBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <span>Run</span>
    `;
    }
}

/* ========================================================================
   Output Display
   ======================================================================== */

/**
 * @param {string} text
 * @param {'success' | 'error' | 'info'} type
 */
function showOutput(text, type) {
    dom.outputPlaceholder.style.display = 'none';
    dom.outputText.style.display = 'block';
    dom.outputText.textContent = text;

    dom.outputText.className = 'output-text';
    if (type === 'error') dom.outputText.classList.add('output--error');
    if (type === 'success') dom.outputText.classList.add('output--success');
}

function showExecStats(status, time, memory) {
    dom.execStats.style.display = 'flex';

    const isOk = status === 'Accepted' || status === 'success';
    dom.statStatus.textContent = `Status: ${status || 'N/A'}`;
    dom.statStatus.className = `stat ${isOk ? 'stat--ok' : 'stat--fail'}`;

    dom.statTime.textContent = `Time: ${time || 'N/A'}`;
    dom.statTime.className = 'stat';

    dom.statMemory.textContent = `Memory: ${memory || 'N/A'}`;
    dom.statMemory.className = 'stat';
}

function clearOutput() {
    dom.outputPlaceholder.style.display = 'flex';
    dom.outputText.style.display = 'none';
    dom.outputText.textContent = '';
    dom.outputText.className = 'output-text';
    dom.execStats.style.display = 'none';
}

/* ========================================================================
   Stdin Toggle
   ======================================================================== */

function toggleStdin() {
    const panel = dom.stdinPanel;
    const isVisible = panel.style.display !== 'none';
    panel.style.display = isVisible ? 'none' : 'block';
    dom.stdinToggleBtn.classList.toggle('btn--active', !isVisible);

    // Re-layout editor after stdin panel toggle
    setTimeout(() => {
        if (typeof editorInstance !== 'undefined' && editorInstance) {
            editorInstance.layout();
        }
    }, 50);
}

/* ========================================================================
   Save Program
   ======================================================================== */

/** @type {string | null} If set, we're editing an existing program */
let editingProgramId = null;

function openSaveModal(existingTitle = '') {
    if (!isLoggedIn()) {
        showToast('Please login to save programs', 'info');
        openAuthModal('login');
        return;
    }
    dom.saveModal.style.display = 'flex';
    dom.programTitleInput.value = existingTitle;
    dom.programTitleInput.focus();
}

function closeSaveModal() {
    dom.saveModal.style.display = 'none';
    dom.programTitleInput.value = '';
    editingProgramId = null;
}

async function handleSaveProgram() {
    const title = dom.programTitleInput.value.trim();
    if (!title) {
        showToast('Please enter a program title', 'error');
        return;
    }

    const code = getEditorCode();
    const language = getCurrentLanguage();

    try {
        if (editingProgramId) {
            // Update existing program
            await axios.put(`${API_BASE}/programs/${editingProgramId}`, {
                title,
                language,
                code,
            }, { headers: getAuthHeaders() });
            showToast('Program updated! ✅', 'success');
        } else {
            // Create new program
            await axios.post(`${API_BASE}/programs`, {
                title,
                language,
                code,
            }, { headers: getAuthHeaders() });
            showToast('Program saved! ✅', 'success');
        }

        closeSaveModal();
    } catch (err) {
        const message = err.response?.data?.error || 'Failed to save program';
        showToast(message, 'error');
        console.error('[Save]', err);
    }
}

/* ========================================================================
   Load Programs
   ======================================================================== */

async function loadPrograms() {
    if (!isLoggedIn()) {
        dom.programsGrid.innerHTML = '';
        dom.programsGrid.appendChild(createEmptyState(
            'Login to see your programs',
            'Create an account to save and manage your code!'
        ));
        return;
    }
    try {
        const response = await axios.get(`${API_BASE}/programs`, { headers: getAuthHeaders() });
        const programs = response.data;

        if (!programs || programs.length === 0) {
            dom.programsGrid.innerHTML = '';
            dom.programsGrid.appendChild(createEmptyState(
                'No saved programs yet',
                'Save your first program from the editor!'
            ));
            return;
        }

        dom.programsGrid.innerHTML = programs.map((prog) => `
      <div class="program-card" data-id="${prog._id}">
        <div class="program-card__title">
          ${escapeHtml(prog.title)}
          <span class="program-card__lang lang--${prog.language}">${prog.language}</span>
        </div>
        <div class="program-card__date">
          Created ${formatDate(prog.created_at)}
        </div>
        <div class="program-card__actions">
          <button class="btn btn--secondary" onclick="openProgram('${prog._id}')">
            Open
          </button>
          <button class="btn btn--ghost" onclick="editProgram('${prog._id}', '${escapeHtml(prog.title)}')">
            Edit
          </button>
          <button class="btn btn--danger" onclick="deleteProgram('${prog._id}')">
            Delete
          </button>
        </div>
      </div>
    `).join('');

    } catch (err) {
        console.error('[Programs]', err);
        showToast('Failed to load programs', 'error');
    }
}

/**
 * Open a saved program in the editor.
 */
async function openProgram(id) {
    try {
        const response = await axios.get(`${API_BASE}/programs/${id}`, { headers: getAuthHeaders() });
        const program = response.data;

        // Switch to editor tab
        switchTab('editor');

        // Set language
        dom.languageSelect.value = program.language;
        switchLanguage(program.language);

        // Set code
        setEditorCode(program.code);

        showToast(`Opened "${program.title}"`, 'info');
    } catch (err) {
        console.error('[Open program]', err);
        showToast('Failed to open program', 'error');
    }
}

/**
 * Open save modal in edit mode for an existing program.
 */
function editProgram(id, title) {
    editingProgramId = id;
    openSaveModal(title);
}

/**
 * Delete a saved program.
 */
async function deleteProgram(id) {
    if (!confirm('Are you sure you want to delete this program?')) return;

    try {
        await axios.delete(`${API_BASE}/programs/${id}`, { headers: getAuthHeaders() });
        showToast('Program deleted', 'info');
        loadPrograms(); // Refresh the list
    } catch (err) {
        console.error('[Delete program]', err);
        showToast('Failed to delete program', 'error');
    }
}

/* ========================================================================
   Execution History
   ======================================================================== */

async function loadHistory() {
    if (!isLoggedIn()) {
        dom.historyList.innerHTML = '';
        dom.historyList.appendChild(createEmptyState(
            'Login to see your history',
            'Create an account to track your code runs!'
        ));
        return;
    }
    try {
        const response = await axios.get(`${API_BASE}/executions`, { headers: getAuthHeaders() });
        const executions = response.data;

        if (!executions || executions.length === 0) {
            dom.historyList.innerHTML = '';
            dom.historyList.appendChild(createEmptyState(
                'No execution history yet',
                'Run some code to build your history!'
            ));
            return;
        }

        dom.historyList.innerHTML = `
      <div class="history-item" style="font-weight:600; color: var(--text-muted); cursor:default; background: transparent; border-color: transparent;">
        <span>Language</span>
        <span>Code</span>
        <span>Status</span>
        <span>Time</span>
        <span>Date</span>
      </div>
    ` + executions.map((exec) => {
            const hasError = exec.errors && exec.errors.trim().length > 0;
            return `
        <div class="history-item" onclick="loadFromHistory(${JSON.stringify(exec).replace(/"/g, '&quot;')})">
          <span class="history-item__lang">
            <span class="program-card__lang lang--${exec.language}">${exec.language}</span>
          </span>
          <span class="history-item__code">${escapeHtml(exec.code.substring(0, 80))}${exec.code.length > 80 ? '...' : ''}</span>
          <span class="history-item__status ${hasError ? 'history-item__status--fail' : 'history-item__status--ok'}">
            ${hasError ? '✗ Error' : '✓ Success'}
          </span>
          <span class="history-item__time">${exec.execution_time || 'N/A'}</span>
          <span class="history-item__date">${formatDate(exec.created_at)}</span>
        </div>
      `;
        }).join('');

    } catch (err) {
        console.error('[History]', err);
        showToast('Failed to load history', 'error');
    }
}

/**
 * Load code from a history item back into the editor.
 */
function loadFromHistory(execution) {
    switchTab('editor');
    dom.languageSelect.value = execution.language;
    switchLanguage(execution.language);
    setEditorCode(execution.code);
    showToast('Code loaded from history', 'info');
}

/* ========================================================================
   Split Pane Resizer
   ======================================================================== */

function initResizer() {
    const resizer = dom.splitResizer;
    if (!resizer) return;

    let isResizing = false;

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const container = resizer.parentElement;
        const rect = container.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const totalWidth = rect.width;

        const leftPercent = Math.max(20, Math.min(80, (offsetX / totalWidth) * 100));

        const leftPane = container.querySelector('.pane--editor');
        const rightPane = container.querySelector('.pane--output');

        leftPane.style.flex = `0 0 ${leftPercent}%`;
        rightPane.style.flex = `0 0 ${100 - leftPercent}%`;

        // Re-layout Monaco
        if (typeof editorInstance !== 'undefined' && editorInstance) {
            editorInstance.layout();
        }
    });

    document.addEventListener('mouseup', () => {
        if (!isResizing) return;
        isResizing = false;
        resizer.classList.remove('resizing');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}

/* ========================================================================
   Toast Notifications
   ======================================================================== */

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} type
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    dom.toastContainer.appendChild(toast);

    // Auto-remove after animation
    setTimeout(() => {
        if (toast.parentNode) toast.remove();
    }, 3000);
}

/* ========================================================================
   Utility Functions
   ======================================================================== */

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Format an ISO date string to a human-readable format.
 */
function formatDate(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60_000) return 'just now';
    // Less than 1 hour
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    // Less than 24 hours
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    // Less than 7 days
    if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}

/**
 * Create an empty state element.
 */
function createEmptyState(title, subtitle) {
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = `
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
      <polyline points="13 2 13 9 20 9"/>
    </svg>
    <p>${title}</p>
    <span>${subtitle}</span>
  `;
    return div;
}

/* ========================================================================
   AI DEBUGGER — Chatbot
   ======================================================================== */

let isAIProcessing = false;

/** Error patterns that trigger auto-debug */
const ERROR_PATTERNS = [
    'error', 'exception', 'syntaxerror', 'typeerror', 'nameerror',
    'valueerror', 'indexerror', 'keyerror', 'attributeerror',
    'compilation failed', 'runtime error', 'segmentation fault',
    'cannot find symbol', 'undefined reference', 'fatal error',
    'zerodivisionerror', 'unexpected token', 'nullpointerexception',
];

/**
 * Check if error text matches known error patterns.
 */
function isCompilerError(errorText) {
    const lower = errorText.toLowerCase();
    return ERROR_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Automatically triggered when code execution returns an error.
 */
async function autoDebugError(code, language, errorText) {
    if (!isCompilerError(errorText)) return;
    if (isAIProcessing) return;

    openChatbot();
    await sendDebugRequest(code, language, errorText);
}

/**
 * Open the chatbot panel.
 */
function openChatbot() {
    dom.chatbot.style.display = 'flex';
}

/**
 * Close the chatbot panel.
 */
function closeChatbot() {
    dom.chatbot.style.display = 'none';
}

/**
 * Show typing indicator in chatbot.
 */
function showTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-typing';
    typing.id = 'chat-typing-indicator';
    typing.innerHTML = `
        <div class="chat-typing__dots">
            <span></span><span></span><span></span>
        </div>
        <span>AI is analyzing your code...</span>
    `;
    dom.chatbotMessages.appendChild(typing);
    dom.chatbotMessages.scrollTop = dom.chatbotMessages.scrollHeight;
}

/**
 * Remove typing indicator.
 */
function removeTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator');
    if (indicator) indicator.remove();
}

/**
 * Add an AI message to the chatbot.
 */
const _pendingFixes = []; // Store fix code to avoid HTML encoding issues

function addChatMessage(data, isFixMyCode = false) {
    // Remove welcome message if present
    const welcome = dom.chatbotMessages.querySelector('.chatbot__welcome');
    if (welcome) welcome.remove();

    const msg = document.createElement('div');
    msg.className = 'chat-msg chat-msg--ai';

    const label = isFixMyCode ? '✨ AI Code Fix' : '🔍 Error Detected';

    let errorTypeHtml = '';
    if (data.error_type && !isFixMyCode) {
        errorTypeHtml = `<div class="chat-msg--error-type">⚠️ ${escapeHtml(data.error_type)}</div>`;
    }

    // Store fix code in array and reference by index
    const fixIndex = _pendingFixes.length;
    _pendingFixes.push(data.fixed_code || '');

    msg.innerHTML = `
        <div class="chat-msg__bubble">
            <div class="chat-msg__label">${label}</div>
            ${errorTypeHtml}
            <div class="chat-msg__explanation">${escapeHtml(data.explanation)}</div>
            <div class="chat-msg__code-block">
                <div class="chat-msg__code-header">
                    <span>${isFixMyCode ? 'Improved Code' : 'Suggested Fix'}</span>
                </div>
                <pre class="chat-msg__code">${escapeHtml(data.fixed_code)}</pre>
            </div>
            <button class="btn--apply-fix" onclick="applyFix(${fixIndex})">
                ✅ Apply Fix
            </button>
        </div>
    `;

    dom.chatbotMessages.appendChild(msg);
    dom.chatbotMessages.scrollTop = dom.chatbotMessages.scrollHeight;
}

/**
 * Send code + error to AI debug endpoint.
 */
async function sendDebugRequest(code, language, errorText) {
    if (isAIProcessing) return;
    isAIProcessing = true;

    showTypingIndicator();

    try {
        const response = await axios.post(`${API_BASE}/debug`, {
            language,
            code,
            error: errorText,
        });

        removeTypingIndicator();
        addChatMessage(response.data, false);

    } catch (err) {
        removeTypingIndicator();
        const errMsg = err.response?.data?.error || 'AI analysis failed. Please try again.';
        addChatMessage({
            explanation: errMsg,
            fixed_code: code,
            error_type: 'AI Error',
        }, false);
        console.error('[AI Debug]', err);
    } finally {
        isAIProcessing = false;
    }
}

/**
 * "Fix My Code" button handler — sends code to AI for optimization.
 */
async function handleFixMyCode() {
    const code = getEditorCode();
    const language = getCurrentLanguage();

    if (!code.trim()) {
        showToast('Please write some code first!', 'error');
        return;
    }

    if (isAIProcessing) {
        showToast('AI is already processing...', 'info');
        return;
    }

    openChatbot();
    isAIProcessing = true;
    showTypingIndicator();

    try {
        const response = await axios.post(`${API_BASE}/debug/fix`, {
            language,
            code,
        });

        removeTypingIndicator();
        addChatMessage(response.data, true);

    } catch (err) {
        removeTypingIndicator();
        const errMsg = err.response?.data?.error || 'AI fix failed. Please try again.';
        addChatMessage({
            explanation: errMsg,
            fixed_code: code,
        }, true);
        console.error('[AI Fix]', err);
    } finally {
        isAIProcessing = false;
    }
}

/**
 * Apply the AI-suggested fix to the editor.
 */
function applyFix(fixIndex) {
    const fixedCode = _pendingFixes[fixIndex];

    if (fixedCode) {
        setEditorCode(fixedCode);
        showToast('Fix applied to editor! ✅', 'success');
    } else {
        showToast('No fix available to apply', 'error');
    }
}

/* ========================================================================
   Authentication
   ======================================================================== */

/**
 * Get auth headers for API requests.
 */
function getAuthHeaders() {
    const token = localStorage.getItem('codejudge_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Check if user is logged in.
 */
function isLoggedIn() {
    return !!localStorage.getItem('codejudge_token');
}

/**
 * Initialize auth state on page load.
 */
function initAuth() {
    const userData = localStorage.getItem('codejudge_user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            updateAuthUI(user);
        } catch {
            localStorage.removeItem('codejudge_token');
            localStorage.removeItem('codejudge_user');
        }
    }
}

/**
 * Update navbar UI based on auth state.
 */
function updateAuthUI(user) {
    if (user) {
        // Show App, Hide Landing
        dom.landingPage.style.display = 'none';
        dom.appContainer.style.display = 'block';

        dom.loginBtn.style.display = 'none';
        dom.userBadge.style.display = 'flex';
        dom.userName.textContent = user.name;

        // Show avatar image for Google users, initial letter for email users
        if (user.avatar) {
            dom.userAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        } else {
            dom.userAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
    } else {
        // Show Landing, Hide App
        dom.landingPage.style.display = 'flex';
        dom.appContainer.style.display = 'none';

        dom.loginBtn.style.display = 'inline-flex';
        dom.userBadge.style.display = 'none';
    }
}

/**
 * Open auth modal (login or register).
 */
function openAuthModal(mode = 'login') {
    dom.authError.style.display = 'none';
    dom.authError.textContent = '';

    if (mode === 'login') {
        dom.authModalTitle.textContent = 'Login';
        dom.loginForm.style.display = 'flex';
        dom.registerForm.style.display = 'none';
    } else {
        dom.authModalTitle.textContent = 'Create Account';
        dom.loginForm.style.display = 'none';
        dom.registerForm.style.display = 'flex';
    }

    dom.authModal.style.display = 'flex';
}

/**
 * Close auth modal.
 */
function closeAuthModal() {
    dom.authModal.style.display = 'none';
    dom.loginForm.reset();
    dom.registerForm.reset();
    dom.authError.style.display = 'none';
}

/**
 * Show auth error.
 */
function showAuthError(msg) {
    dom.authError.textContent = msg;
    dom.authError.style.display = 'block';
}

/**
 * Handle login form submit.
 */
async function handleLogin(e) {
    e.preventDefault();

    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    dom.loginSubmitBtn.disabled = true;
    dom.loginSubmitBtn.textContent = 'Logging in...';

    try {
        const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
        const { token, user } = response.data;

        localStorage.setItem('codejudge_token', token);
        localStorage.setItem('codejudge_user', JSON.stringify(user));

        updateAuthUI(user);
        closeAuthModal();
        showToast(`Welcome back, ${user.name}! 🎉`, 'success');
    } catch (err) {
        const msg = err.response?.data?.error || 'Login failed. Please try again.';
        showAuthError(msg);
    } finally {
        dom.loginSubmitBtn.disabled = false;
        dom.loginSubmitBtn.textContent = 'Login';
    }
}

/**
 * Handle register form submit.
 */
async function handleRegister(e) {
    e.preventDefault();

    const name = dom.registerName.value.trim();
    const email = dom.registerEmail.value.trim();
    const password = dom.registerPassword.value;

    if (!name || !email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showAuthError('Password must be at least 6 characters');
        return;
    }

    dom.registerSubmitBtn.disabled = true;
    dom.registerSubmitBtn.textContent = 'Creating...';

    try {
        const response = await axios.post(`${API_BASE}/auth/register`, { name, email, password });
        const { token, user } = response.data;

        localStorage.setItem('codejudge_token', token);
        localStorage.setItem('codejudge_user', JSON.stringify(user));

        updateAuthUI(user);
        closeAuthModal();
        showToast(`Account created! Welcome, ${user.name}! 🚀`, 'success');
    } catch (err) {
        const msg = err.response?.data?.error || 'Registration failed. Please try again.';
        showAuthError(msg);
    } finally {
        dom.registerSubmitBtn.disabled = false;
        dom.registerSubmitBtn.textContent = 'Create Account';
    }
}

/**
 * Handle logout.
 */
function handleLogout() {
    localStorage.removeItem('codejudge_token');
    localStorage.removeItem('codejudge_user');
    updateAuthUI(null);
    showToast('Logged out. See you soon! 👋', 'info');
}

/**
 * Google Sign-In — trigger the Google popup.
 */
function handleGoogleSignIn() {
    if (typeof google === 'undefined' || !google.accounts) {
        showAuthError('Google Sign-In is loading... Please try again in a moment.');
        return;
    }

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
    });

    google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback: use One Tap or direct popup
            google.accounts.id.renderButton(
                document.createElement('div'),
                { theme: 'outline', size: 'large' }
            );
            // Trigger popup manually
            google.accounts.id.prompt();
        }
    });
}

/**
 * Google credential callback — send to backend.
 */
async function handleGoogleCredential(response) {
    try {
        dom.googleSignInBtn.disabled = true;
        dom.googleSignInBtn.textContent = 'Signing in...';

        const res = await axios.post(`${API_BASE}/auth/google`, {
            credential: response.credential,
        });

        const { token, user } = res.data;

        localStorage.setItem('codejudge_token', token);
        localStorage.setItem('codejudge_user', JSON.stringify(user));

        updateAuthUI(user);
        closeAuthModal();
        showToast(`Welcome, ${user.name}! 🎉`, 'success');
    } catch (err) {
        const msg = err.response?.data?.error || 'Google sign-in failed. Please try again.';
        showAuthError(msg);
    } finally {
        dom.googleSignInBtn.disabled = false;
        dom.googleSignInBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
        `;
    }
}

// Google Client ID — loaded from config
const GOOGLE_CLIENT_ID = '253644243742-colo9tso7bnctp84ef4fpds95pndmdka.apps.googleusercontent.com';
