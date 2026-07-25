import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './components/ThemeToggle';
import JsonTreeViewer from './components/JsonTreeViewer';

const DEFAULT_SAMPLE_JSON = `{
  "appName": "SimplJSON",
  "version": "1.0.0",
  "developer": {
    "name": "Antigravity Devs",
    "github": "https://github.com",
    "active": true
  },
  "features": [
    "Real-time JSON validation",
    "Interactive expandable tree view",
    "Full-text search & value highlights",
    "Prettify & Minify utilities",
    "Smooth dark/light mode toggle"
  ],
  "stats": {
    "rating": 4.98,
    "users": 15000,
    "openSource": true,
    "license": "MIT"
  }
}`;

function getDetailedError(err, jsonStr) {
  const message = err.message;
  let line = null;
  let column = null;
  
  // Look for V8 positions e.g., "at position 45"
  const posMatch = message.match(/at position (\d+)/i) || message.match(/at (\d+)/i);
  if (posMatch) {
    const position = parseInt(posMatch[1], 10);
    const substring = jsonStr.substring(0, position);
    const lines = substring.split('\n');
    line = lines.length;
    column = lines[lines.length - 1].length + 1;
  }
  
  // Look for Firefox style error messages "line 5 column 10"
  const lineColMatch = message.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  }
  
  const cleanMessage = message
    .replace(/in JSON at position \d+/i, '')
    .replace(/at position \d+/i, '')
    .trim();
    
  return {
    message: cleanMessage,
    line,
    column
  };
}

export default function App() {
  const [inputJson, setInputJson] = useState(DEFAULT_SAMPLE_JSON);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [defaultExpanded, setDefaultExpanded] = useState(true);
  const [expandVersion, setExpandVersion] = useState(0);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Split-pane offset states
  const [splitWidth, setSplitWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('splitWidth');
      if (saved) return parseFloat(saved);
    }
    return 50; // Default 50% split
  });
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  const textareaRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = moveEvent.clientX - rect.left;
      const percentage = (newWidth / rect.width) * 100;

      // Enforce bounds between 20% and 80%
      if (percentage >= 20 && percentage <= 80) {
        setSplitWidth(percentage);
        localStorage.setItem('splitWidth', percentage.toString());
      }
    };

    const handleMouseUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Real-time parsing effect
  useEffect(() => {
    if (!inputJson.trim()) {
      setParsedData(null);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      setParsedData(parsed);
      setError(null);
    } catch (err) {
      const detailed = getDetailedError(err, inputJson);
      setError(detailed);
      // We keep parsedData as is or clear it to avoid stale representations
      setParsedData(null);
    }
  }, [inputJson]);

  // Utility Actions
  const handlePrettify = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setInputJson(formatted);
    } catch (err) {
      // Don't format if invalid
    }
  };

  const handleMinify = () => {
    if (!inputJson.trim()) return;
    try {
      const parsed = JSON.parse(inputJson);
      const minified = JSON.stringify(parsed);
      setInputJson(minified);
    } catch (err) {
      // Don't format if invalid
    }
  };

  const handleClear = () => {
    setInputJson('');
    setParsedData(null);
    setError(null);
    setFilterQuery('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleLoadSample = () => {
    setInputJson(DEFAULT_SAMPLE_JSON);
    setFilterQuery('');
  };

  const handleCopyInput = () => {
    if (!inputJson) return;
    navigator.clipboard.writeText(inputJson).then(() => {
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2000);
    });
  };

  const triggerExpandAll = () => {
    setDefaultExpanded(true);
    setExpandVersion(v => v + 1);
  };

  const triggerCollapseAll = () => {
    setDefaultExpanded(false);
    setExpandVersion(v => v + 1);
  };

  // Get lines and characters counts
  const lineCount = inputJson ? inputJson.split('\n').length : 0;
  const charCount = inputJson ? inputJson.length : 0;
  const byteSize = inputJson ? new Blob([inputJson]).size : 0;

  // Format byte size helper
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 transition-colors-custom duration-300 flex flex-col font-sans antialiased">
      {/* Top Navigation / Header */}
      <header className="sticky top-0 z-40 w-full bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/80 dark:border-zinc-900/80 backdrop-blur-md transition-colors-custom duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 dark:from-indigo-600 dark:to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5 leading-none">
                Simpl<span className="text-indigo-600 dark:text-indigo-400">JSON</span>
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium tracking-wide uppercase mt-0.5">Lightweight Interactive Viewer</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer shadow-sm transition-all duration-300 flex items-center justify-center"
              aria-label="GitHub Project"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 my-4 overflow-hidden flex flex-col min-h-0">
        {/* Main Split Container */}
        <div 
          ref={containerRef}
          className="flex flex-col lg:flex-row gap-4 lg:gap-0 items-stretch flex-1 min-h-0 relative"
        >
          
          {/* Left Panel: Editor Area */}
          <div 
            style={{ flex: isLargeScreen ? `0 0 ${splitWidth}%` : 'none' }}
            className="flex flex-col w-full h-full min-h-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 lg:pr-3"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-150 text-sm">Input JSON</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleLoadSample}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors font-medium"
                >
                  Load Sample
                </button>
                <button
                  onClick={handleCopyInput}
                  disabled={!inputJson}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
                >
                  {copiedSuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Input Textarea Container */}
            <div className="relative flex-1 min-h-[400px] flex flex-col p-4">
              <textarea
                ref={textareaRef}
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder="Paste your raw JSON here..."
                spellCheck="false"
                className="flex-1 w-full h-full resize-none font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-zinc-400 dark:placeholder-zinc-600 select-text overflow-y-auto"
                id="json-textarea-input"
              />
              
              {/* Validation Feedback Banner */}
              {error && (
                <div className="mt-4 p-4 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/30 rounded-2xl flex flex-col gap-1 transition-all duration-300">
                  <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold text-sm">Invalid JSON Syntax</span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs font-mono break-words pl-7 mt-0.5">
                    {error.message}
                  </p>
                  {(error.line !== null || error.column !== null) && (
                    <span className="text-[10px] text-rose-500 font-semibold pl-7 tracking-wider uppercase mt-1">
                      {error.line !== null && `Line ${error.line}`}
                      {error.column !== null && `, Column ${error.column}`}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50 flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrettify}
                  disabled={!!error || !inputJson.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-indigo-600 dark:disabled:hover:bg-indigo-500 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
                  title="Format JSON with nice indentation"
                >
                  Prettify
                </button>
                <button
                  onClick={handleMinify}
                  disabled={!!error || !inputJson.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Remove all whitespace"
                >
                  Minify
                </button>
                <button
                  onClick={handleClear}
                  disabled={!inputJson.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-50 hover:bg-red-100/80 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 border border-red-200/30 dark:border-red-900/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">
                <span>{lineCount} lines</span>
                <span>•</span>
                <span>{charCount} chars</span>
                <span>•</span>
                <span>{formatBytes(byteSize)}</span>
              </div>
            </div>
          </div>

          {/* Draggable Resizer Bar (Visible only on desktop lg) */}
          <div 
            onMouseDown={handleMouseDown}
            className="hidden lg:flex w-4 items-center justify-center cursor-col-resize select-none relative z-30 mx-[-8px] group/divider"
          >
            <div className="w-[1px] h-[95%] bg-zinc-200/80 dark:bg-zinc-800/80 group-hover/divider:bg-indigo-500 dark:group-hover/divider:bg-indigo-400 group-active/divider:bg-indigo-650 transition-colors duration-150"></div>
            <div className="absolute w-4 h-7 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center gap-[1.5px] opacity-0 group-hover/divider:opacity-100 group-active/divider:opacity-100 transition-opacity duration-200 border-indigo-100 dark:border-indigo-950">
              <div className="w-[1.5px] h-2.5 bg-zinc-400 dark:bg-zinc-650 rounded-full"></div>
              <div className="w-[1.5px] h-2.5 bg-zinc-400 dark:bg-zinc-650 rounded-full"></div>
            </div>
          </div>

          {/* Right Panel: Interactive Simplified Tree */}
          <div 
            style={{ flex: isLargeScreen ? `0 0 ${100 - splitWidth}%` : 'none' }}
            className="flex flex-col w-full h-full min-h-0 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 lg:pl-3"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-150 text-sm">Simplified View</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <button
                  onClick={triggerExpandAll}
                  disabled={!parsedData}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Expand All
                </button>
                <button
                  onClick={triggerCollapseAll}
                  disabled={!parsedData}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Tree Workspace */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden min-h-0">
              
              {/* Filter Search Input */}
              {parsedData && (
                <div className="relative group/search">
                  <input
                    type="text"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Search keys or values..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-zinc-50 hover:bg-zinc-100/50 dark:bg-zinc-950 dark:hover:bg-zinc-950 focus:bg-white dark:focus:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500/60 dark:focus:border-indigo-500/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 dark:focus:ring-indigo-400/10 transition-all font-sans"
                    id="search-json-filter"
                  />
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600 pointer-events-none group-focus-within/search:text-indigo-500 dark:group-focus-within/search:text-indigo-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
                    </svg>
                  </div>
                  {filterQuery && (
                    <button
                      onClick={() => setFilterQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Clear search"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              {/* Viewer Wrapper */}
              <div className="flex-1 select-text overflow-y-auto min-h-0">
                <JsonTreeViewer
                  data={parsedData}
                  filterQuery={filterQuery}
                  defaultExpanded={defaultExpanded}
                  expandVersion={expandVersion}
                />
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
