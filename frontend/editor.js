/**
 * editor.js — Monaco Editor Setup & Management
 * 
 * Initializes the Monaco Editor with dark theme, syntax highlighting,
 * and language switching support.
 */

/* ========================================================================
   Language Configuration
   ======================================================================== */

/**
 * Maps UI language values to Monaco Editor language identifiers
 * and default starter code templates.
 */
const LANGUAGE_CONFIG = {
  python: {
    monacoId: 'python',
    fileName: 'main.py',
    template: `# Welcome to CodeJudge ⚡
# Write your Python code here

def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  },
  cpp: {
    monacoId: 'cpp',
    fileName: 'main.cpp',
    template: `// Welcome to CodeJudge ⚡
// Write your C++ code here

#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,
  },
  java: {
    monacoId: 'java',
    fileName: 'Main.java',
    template: `// Welcome to CodeJudge ⚡
// Write your Java code here

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  javascript: {
    monacoId: 'javascript',
    fileName: 'main.js',
    template: `// Welcome to CodeJudge ⚡
// Write your JavaScript code here

function main() {
  console.log("Hello, World!");
}

main();
`,
  },
};

/* ========================================================================
   Editor Singleton
   ======================================================================== */

/** @type {monaco.editor.IStandaloneCodeEditor | null} */
let editorInstance = null;

/** @type {string} Current active language key */
let currentLanguage = 'python';

/**
 * Initialize the Monaco Editor in the given container.
 * Should be called once after the DOM is ready and Monaco is loaded.
 */
function initEditor() {
  const container = document.getElementById('monaco-editor');
  if (!container) {
    console.error('[Editor] Container #monaco-editor not found');
    return;
  }

  // Define a custom dark theme based on VS Code's defaults
  monaco.editor.defineTheme('codejudge-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment',  foreground: '6c7086', fontStyle: 'italic' },
      { token: 'keyword',  foreground: 'cba6f7' },
      { token: 'string',   foreground: 'a6e3a1' },
      { token: 'number',   foreground: 'fab387' },
      { token: 'type',     foreground: '89b4fa' },
      { token: 'function', foreground: '89dceb' },
      { token: 'variable', foreground: 'cdd6f4' },
    ],
    colors: {
      'editor.background':              '#1e1e2e',
      'editor.foreground':              '#cdd6f4',
      'editor.lineHighlightBackground': '#313244',
      'editor.selectionBackground':     '#45475a',
      'editor.inactiveSelectionBackground': '#313244',
      'editorCursor.foreground':        '#f5e0dc',
      'editorWhitespace.foreground':    '#313244',
      'editorIndentGuide.background':   '#313244',
      'editorIndentGuide.activeBackground': '#45475a',
      'editorLineNumber.foreground':    '#6c7086',
      'editorLineNumber.activeForeground': '#cdd6f4',
      'editor.selectionHighlightBackground': '#45475a80',
    },
  });

  // Create the editor instance
  editorInstance = monaco.editor.create(container, {
    value: LANGUAGE_CONFIG[currentLanguage].template,
    language: LANGUAGE_CONFIG[currentLanguage].monacoId,
    theme: 'codejudge-dark',
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineNumbers: 'on',
    minimap: { enabled: true, scale: 1, showSlider: 'mouseover' },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12, bottom: 12 },
    renderLineHighlight: 'all',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    bracketPairColorization: { enabled: true },
    guides: { bracketPairs: true, indentation: true },
    suggest: { showMethods: true, showFunctions: true },
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    roundedSelection: true,
    renderWhitespace: 'selection',
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    if (editorInstance) editorInstance.layout();
  });

  console.log('[Editor] Monaco Editor initialized');
}

/**
 * Switch the editor language and update the model.
 * @param {string} langKey — One of: 'python', 'cpp', 'java', 'javascript'
 */
function switchLanguage(langKey) {
  if (!LANGUAGE_CONFIG[langKey]) {
    console.warn(`[Editor] Unknown language: ${langKey}`);
    return;
  }

  const config = LANGUAGE_CONFIG[langKey];
  currentLanguage = langKey;

  if (editorInstance) {
    const model = editorInstance.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, config.monacoId);
    }

    // Only set template if the editor is currently showing a different template
    const currentCode = editorInstance.getValue();
    const isDefaultTemplate = Object.values(LANGUAGE_CONFIG).some(
      (cfg) => cfg.template.trim() === currentCode.trim()
    );
    if (isDefaultTemplate || !currentCode.trim()) {
      editorInstance.setValue(config.template);
    }
  }

  // Update the filename display
  const filenameEl = document.getElementById('editor-filename');
  if (filenameEl) filenameEl.textContent = config.fileName;
}

/**
 * Get the current code from the editor.
 * @returns {string}
 */
function getEditorCode() {
  return editorInstance ? editorInstance.getValue() : '';
}

/**
 * Set code in the editor.
 * @param {string} code
 */
function setEditorCode(code) {
  if (editorInstance) editorInstance.setValue(code);
}

/**
 * Get the current language key.
 * @returns {string}
 */
function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Get the LANGUAGE_CONFIG export for external use.
 */
function getLanguageConfig() {
  return LANGUAGE_CONFIG;
}
