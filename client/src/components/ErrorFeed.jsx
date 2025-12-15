import { useState } from 'react';
import { formatTimestamp, formatRelativeTime, getSeverityClass, truncate } from '../utils/formatters';

/**
 * Real-time error feed component
 */
export function ErrorFeed({ errors, aiStreaming }) {
  const [expandedError, setExpandedError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, critical, high, medium, low

  const filteredErrors = errors.filter(err => {
    if (filter === 'all') return true;
    return (err.ai_severity || err.severity) === filter;
  });

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Error Feed</h2>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-dark-bg border border-dark-border rounded px-3 py-1 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {filteredErrors.length === 0 ? (
          <div className="text-center text-dark-muted py-8">
            {errors.length === 0 ? 'No errors yet. Waiting for incoming errors...' : 'No errors match the current filter.'}
          </div>
        ) : (
          filteredErrors.map(error => (
            <ErrorCard
              key={error.id}
              error={error}
              isExpanded={expandedError === error.id}
              onToggle={() => setExpandedError(expandedError === error.id ? null : error.id)}
              aiStreamingText={aiStreaming[error.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ErrorCard({ error, isExpanded, onToggle, aiStreamingText }) {
  const severity = error.ai_severity || error.severity || 'unknown';
  const category = error.ai_category || 'Processing...';
  const isProcessing = error.ai_status === 'processing';

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all ${
        isExpanded ? 'bg-slate-800 border-slate-600' : 'bg-dark-bg border-dark-border hover:border-slate-600'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`badge ${getSeverityClass(severity)}`}>
              {severity.toUpperCase()}
            </span>
            <span className="badge bg-slate-700 text-slate-300">
              {category}
            </span>
            <span className="text-xs text-dark-muted">
              {error.source}
            </span>
            {isProcessing && (
              <span className="text-xs text-blue-400 animate-pulse">
                ● AI Analyzing...
              </span>
            )}
          </div>

          <p className="text-sm font-mono text-dark-text mb-1">
            {isExpanded ? error.message : truncate(error.message, 120)}
          </p>

          <div className="text-xs text-dark-muted">
            {formatRelativeTime(error.timestamp)} • {formatTimestamp(error.timestamp)}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-dark-border space-y-3">
          {/* AI Hypothesis */}
          {error.ai_hypothesis && (
            <div>
              <h4 className="text-xs font-semibold text-blue-400 mb-1">AI Analysis</h4>
              <p className="text-sm text-dark-text">{error.ai_hypothesis}</p>
            </div>
          )}

          {/* Streaming AI */}
          {aiStreamingText && (
            <div>
              <h4 className="text-xs font-semibold text-blue-400 mb-1">AI Analysis (Streaming...)</h4>
              <p className="text-sm text-dark-text whitespace-pre-wrap">{aiStreamingText}</p>
            </div>
          )}

          {/* Stack Trace */}
          {error.stack_trace && (
            <div>
              <h4 className="text-xs font-semibold text-dark-muted mb-1">Stack Trace</h4>
              <pre className="text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto text-red-300">
                {error.stack_trace}
              </pre>
            </div>
          )}

          {/* Metadata */}
          {error.metadata && Object.keys(error.metadata).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-dark-muted mb-1">Metadata</h4>
              <pre className="text-xs font-mono bg-black/30 p-2 rounded overflow-x-auto">
                {JSON.stringify(error.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {error.environment && (
              <div>
                <span className="text-dark-muted">Environment:</span>{' '}
                <span className="text-dark-text">{error.environment}</span>
              </div>
            )}
            {error.user_id && (
              <div>
                <span className="text-dark-muted">User ID:</span>{' '}
                <span className="text-dark-text">{error.user_id}</span>
              </div>
            )}
            {error.request_id && (
              <div className="col-span-2">
                <span className="text-dark-muted">Request ID:</span>{' '}
                <span className="text-dark-text font-mono">{error.request_id}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorFeed;
