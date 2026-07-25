import { useState, useEffect, useMemo } from 'react';

// Helper to determine if a node or any of its descendants match the search query
function hasSearchMatch(val, key, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  
  // If the key matches, we display the whole node
  if (key && String(key).toLowerCase().includes(q)) {
    return true;
  }
  
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.some((item) => hasSearchMatch(item, null, query));
    }
    return Object.entries(val).some(([k, v]) => hasSearchMatch(v, k, query));
  }
  
  return String(val).toLowerCase().includes(q);
}

// Helper to highlight matched text
function HighlightedText({ text, highlight }) {
  if (!highlight) return <span>{text}</span>;
  const parts = String(text).split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={i} className="bg-amber-200/80 dark:bg-amber-500/40 text-zinc-950 dark:text-zinc-50 rounded px-0.5 font-medium">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Format the path array to a user-friendly string (e.g. root.users[0].name)
function formatPath(path) {
  if (path.length === 0) return 'root';
  return 'root' + path.map(p => {
    if (typeof p === 'number') {
      return `[${p}]`;
    }
    // If it has spaces or special chars, use bracket notation, else dot notation
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(p)) {
      return `.${p}`;
    }
    return `["${p.replace(/"/g, '\\"')}"]`;
  }).join('');
}

function JsonTreeNode({ name, value, path, filterQuery, defaultExpanded, expandVersion, searchMode = 'filter', parentMatched = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);

  // Sync with global Expand All / Collapse All triggers
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded, expandVersion]);

  // Automatically expand if search query is active and there is a match inside
  useEffect(() => {
    if (filterQuery && hasSearchMatch(value, name, filterQuery)) {
      setIsExpanded(true);
    }
  }, [filterQuery, value, name]);

  const isDirectMatch = useMemo(() => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    if (name && String(name).toLowerCase().includes(q)) return true;
    if (typeof value !== 'object' || value === null) {
      return String(value).toLowerCase().includes(q);
    }
    return false;
  }, [name, value, filterQuery]);

  const matches = useMemo(() => {
    if (parentMatched) return true;
    return hasSearchMatch(value, name, filterQuery);
  }, [value, name, filterQuery, parentMatched]);

  const childrenParentMatched = parentMatched || isDirectMatch;

  // If search is active and this node does not match in filter mode, don't render it
  if (filterQuery && searchMode === 'filter' && !matches) {
    return null;
  }

  const handleCopyValue = (e) => {
    e.stopPropagation();
    try {
      const textToCopy = typeof value === 'object' && value !== null 
        ? JSON.stringify(value, null, 2) 
        : String(value);
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Failed to copy value', err);
    }
  };

  const handleCopyPath = (e) => {
    e.stopPropagation();
    try {
      const pathText = formatPath(path);
      navigator.clipboard.writeText(pathText);
      setCopiedPath(true);
      setTimeout(() => setCopiedPath(false), 1500);
    } catch (err) {
      console.error('Failed to copy path', err);
    }
  };

  const isObject = typeof value === 'object' && value !== null;
  const isArray = Array.isArray(value);

  if (isObject) {
    const keys = isArray ? value : Object.keys(value);
    const size = keys.length;
    const isEmpty = size === 0;

    return (
      <div className="pl-4 border-l border-zinc-100 dark:border-zinc-800/80 my-1 relative group/node">
        <div 
          onClick={() => !isEmpty && setIsExpanded(!isExpanded)}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg -ml-1.5 ${
            isEmpty ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30'
          } select-none group/row`}
        >
          {/* Arrow toggle icon */}
          {!isEmpty && (
            <svg
              className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 transform ${
                isExpanded ? 'rotate-90' : 'rotate-0'
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}

          {isEmpty && <div className="w-3.5" />}

          {/* Key name */}
          {name !== undefined && (
            <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              <HighlightedText text={name} highlight={filterQuery} />
              <span className="text-zinc-400 dark:text-zinc-500 font-normal">:</span>
            </span>
          )}

          {/* Type Summary Badge */}
          <span className="font-mono text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/40 px-1.5 py-0.5 rounded border border-zinc-200/50 dark:border-zinc-700/30 font-medium">
            {isArray ? `Array [${size}]` : `Object {${size}}`}
          </span>

          {/* Node Actions */}
          <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1.5 ml-2 transition-opacity duration-150">
            <button
              onClick={handleCopyPath}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              title="Copy path"
            >
              {copiedPath ? 'Copied Path!' : 'Copy Path'}
            </button>
            <button
              onClick={handleCopyValue}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              title="Copy JSON block"
            >
              {copied ? 'Copied JSON!' : 'Copy JSON'}
            </button>
          </div>
        </div>

        {/* Child list */}
        {isExpanded && !isEmpty && (
          <div className="mt-1 transition-all duration-200">
            {isArray
              ? value.map((item, idx) => (
                  <JsonTreeNode
                    key={idx}
                    name={idx}
                    value={item}
                    path={[...path, idx]}
                    filterQuery={filterQuery}
                    defaultExpanded={defaultExpanded}
                    expandVersion={expandVersion}
                    searchMode={searchMode}
                    parentMatched={childrenParentMatched}
                  />
                ))
              : Object.entries(value).map(([key, val]) => (
                  <JsonTreeNode
                    key={key}
                    name={key}
                    value={val}
                    path={[...path, key]}
                    filterQuery={filterQuery}
                    defaultExpanded={defaultExpanded}
                    expandVersion={expandVersion}
                    searchMode={searchMode}
                    parentMatched={childrenParentMatched}
                  />
                ))}
          </div>
        )}
      </div>
    );
  }

  // Primitive Value Render Logic
  let valueStyleClass = '';
  let displayValue = String(value);

  if (value === null) {
    valueStyleClass = 'text-zinc-400 dark:text-zinc-500 font-semibold';
    displayValue = 'null';
  } else if (typeof value === 'string') {
    valueStyleClass = 'text-emerald-600 dark:text-emerald-400 break-all';
    displayValue = `"${value}"`;
  } else if (typeof value === 'number') {
    valueStyleClass = 'text-amber-600 dark:text-amber-400 font-medium';
  } else if (typeof value === 'boolean') {
    valueStyleClass = 'text-violet-600 dark:text-violet-400 font-semibold';
    displayValue = value ? 'true' : 'false';
  }

  return (
    <div className="pl-4 border-l border-zinc-100 dark:border-zinc-800/80 py-0.5 my-0.5 relative group/node select-text">
      <div className="flex flex-wrap items-baseline gap-x-1.5 py-0.5 px-1.5 rounded-lg -ml-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 group/row">
        <div className="w-3.5" />
        
        {/* Key */}
        {name !== undefined && (
          <span className="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            <HighlightedText text={name} highlight={filterQuery} />
            <span className="text-zinc-400 dark:text-zinc-500 font-normal">:</span>
          </span>
        )}

        {/* Value */}
        <span className={`font-mono text-sm ${valueStyleClass}`}>
          <HighlightedText text={displayValue} highlight={filterQuery} />
        </span>

        {/* Tiny Actions */}
        <div className="opacity-0 group-hover/row:opacity-100 flex items-center gap-1.5 ml-2 transition-opacity duration-150">
          <button
            onClick={handleCopyPath}
            className="text-[9px] px-1 py-0.2 rounded bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
            title="Copy path"
          >
            {copiedPath ? 'Copied Path!' : 'Copy Path'}
          </button>
          <button
            onClick={handleCopyValue}
            className="text-[9px] px-1 py-0.2 rounded bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 cursor-pointer"
            title="Copy value"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JsonTreeViewer({ data, filterQuery, defaultExpanded, expandVersion, searchMode = 'filter' }) {
  // Memoize search check at root to show empty status if query matches nothing
  const matchesSearch = useMemo(() => {
    if (!filterQuery) return true;
    return hasSearchMatch(data, null, filterQuery);
  }, [data, filterQuery]);

  if (data === undefined || data === null) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <p className="text-zinc-400 dark:text-zinc-500 font-mono text-sm">No JSON parsed yet.</p>
      </div>
    );
  }

  if (filterQuery && searchMode === 'filter' && !matchesSearch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
        <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z" />
        </svg>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">No search matches found.</p>
        <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Try refining your filter key or value.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-50/30 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-850 rounded-2xl overflow-x-auto min-w-full font-mono text-left">
      <JsonTreeNode
        value={data}
        path={[]}
        filterQuery={filterQuery}
        defaultExpanded={defaultExpanded}
        expandVersion={expandVersion}
        searchMode={searchMode}
        parentMatched={false}
      />
    </div>
  );
}
