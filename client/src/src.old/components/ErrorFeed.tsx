"use client"

import { useState } from "react"
import { AlertCircle, Activity, Clock, User, Hash, ChevronDown, X, ChevronUp, Copy, Check } from "lucide-react"

interface ErrorData {
  id: string
  message: string
  severity?: string
  ai_severity?: string
  ai_category?: string
  category?: string
  source: string
  timestamp: string
  stack_trace?: string
  metadata?: Record<string, unknown>
  environment?: string
  user_id?: string
  request_id?: string
  ai_status?: string
  ai_hypothesis?: string
}

interface ErrorFeedProps {
  errors: ErrorData[]
  aiStreaming?: Record<string, string>
}

export function ErrorFeed({ errors, aiStreaming = {} }: ErrorFeedProps) {
  const [expandedError, setExpandedError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  const filteredErrors = errors.filter((err) => {
    if (filter === "all") return true
    return (err.ai_severity || err.severity) === filter
  })

  return (
    <div className="glass-card h-full flex flex-col rounded-xl overflow-hidden neon-border" role="region" aria-label="Error feed">
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/30 glow-primary">
            <Activity className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Live Error Feed</h2>
            <p className="text-sm text-muted-foreground">Real-time monitoring</p>
          </div>
        </div>
        <div className="relative">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none bg-muted/70 border-2 border-primary/40 rounded-lg pl-5 pr-12 py-2.5 text-base font-semibold backdrop-blur-sm hover:border-primary/70 hover:bg-muted/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"
            aria-label="Filter by severity"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 relative"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        <div className="absolute inset-0 scan-line pointer-events-none" aria-hidden="true" />
        {filteredErrors.length === 0 ? (
          <div className="text-center text-muted-foreground py-12" role="status">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
            <p className="text-base">
              {errors.length === 0
                ? "No errors detected. System running smoothly..."
                : "No errors match the current filter."}
            </p>
          </div>
        ) : (
          filteredErrors.map((error) => (
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
  )
}

function ErrorCard({
  error,
  isExpanded,
  onToggle,
  aiStreamingText,
}: {
  error: ErrorData
  isExpanded: boolean
  onToggle: () => void
  aiStreamingText?: string
}) {
  const [copiedMetadata, setCopiedMetadata] = useState(false)
  const [copiedStack, setCopiedStack] = useState(false)
  const severity = error.ai_severity || error.severity || "unknown"
  const category = error.ai_category || "Processing..."
  const isProcessing = error.ai_status === "processing"

  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getSeverityColor = (sev: string) => {
    switch (sev.toLowerCase()) {
      case "critical":
        return "from-destructive/20 to-destructive/5 border-destructive/40 text-destructive"
      case "high":
        return "from-warning/20 to-warning/5 border-warning/40 text-warning"
      case "medium":
        return "from-accent/20 to-accent/5 border-accent/40 text-accent"
      default:
        return "from-primary/20 to-primary/5 border-primary/40 text-primary"
    }
  }

  return (
    <div
      className={`border rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
        isExpanded
          ? "bg-foreground border-primary/60 glow-primary shadow-xl"
          : "glass-card hover:border-primary/40 hover:bg-muted/40"
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onToggle()
        }
      }}
      aria-expanded={isExpanded}
      aria-label={`Error: ${error.message.slice(0, 50)}...`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider bg-gradient-to-r ${getSeverityColor(
                  severity,
                )}`}
              >
                {severity}
              </span>
              <span className="px-4 py-1.5 rounded-full text-sm font-semibold bg-secondary/30 text-secondary border border-secondary/40">
                {category}
              </span>
              <span className="text-sm text-muted-foreground font-mono">{error.source}</span>
              {isProcessing && (
                <span className="flex items-center gap-1.5 text-sm text-accent animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent glow-accent" />
                  AI Analyzing...
                </span>
              )}
            </div>

            <p className="text-base font-mono text-white mb-3 leading-relaxed">
              {isExpanded ? error.message : error.message.slice(0, 120) + (error.message.length > 120 ? "..." : "")}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
              <span>{new Date(error.timestamp).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <div className="flex items-center gap-2">
            {isExpanded && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
                className="p-2 rounded-lg hover:bg-destructive/20 transition-colors border border-border/50 hover:border-destructive/50"
                aria-label="Close expanded view"
              >
                <X className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </button>
            )}
            <div className="p-2 rounded-lg bg-muted/40 border border-border/50">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-primary" />
              ) : (
                <ChevronDown className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 pt-6 border-t-2 border-border/50 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {error.ai_hypothesis && (
              <div className="p-5 rounded-lg bg-primary/20 border-2 border-primary/40 shadow-lg">
                <h4 className="text-base font-bold text-card uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  AI Analysis
                </h4>
                <p className="text-base text-card/80 leading-relaxed">{error.ai_hypothesis}</p>
              </div>
            )}

            {aiStreamingText && (
              <div className="p-5 rounded-lg bg-accent/20 border-2 border-accent/40 pulse-glow shadow-lg">
                <h4 className="text-base font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5 animate-pulse" />
                  Streaming Analysis...
                </h4>
                <p className="text-base text-foreground/90 whitespace-pre-wrap leading-relaxed">{aiStreamingText}</p>
              </div>
            )}

            {error.stack_trace && (
              <div className="p-5 rounded-lg bg-destructive/20 border-2 border-destructive/40 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Stack Trace
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(error.stack_trace!, setCopiedStack)
                    }}
                    className="p-2 rounded-lg transition-colors border border-border/50 focus:outline-none focus:ring-2 focus:ring-destructive/60 cursor-pointer hover:bg-background/40 !hover:text-destructive"
                    aria-label="Copy stack trace"
                    title="Copy stack trace"
                  >
                    {copiedStack ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground !hover:text-destructive" />
                    )}
                  </button>
                </div>
                <pre className="text-sm font-mono bg-background/80 p-4 rounded overflow-x-auto text-foreground/90 leading-relaxed border border-border/30">
                  {error.stack_trace}
                </pre>
              </div>
            )}

            {error.metadata && Object.keys(error.metadata).length > 0 && (
              <div className="p-5 rounded-lg bg-muted/10 border-2 border-border/60 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-bold text-card uppercase tracking-wider flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Metadata
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(JSON.stringify(error.metadata, null, 2), setCopiedMetadata)
                    }}
                    className="p-2 rounded-lg hover:bg-background/40 transition-colors border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer !hover:text-primary"
                    aria-label="Copy metadata JSON"
                    title="Copy metadata JSON"
                  >
                    {copiedMetadata ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground !hover:text-primary" />
                    )}
                  </button>
                </div>
                <pre className="text-sm font-mono bg-background/80 p-4 rounded overflow-x-auto text-foreground/90 leading-relaxed border border-border/30">
                  {JSON.stringify(error.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {error.environment && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Hash className="w-4 h-4 text-accent" />
                  <span className="text-muted/80 font-medium">Environment:</span>
                  <span className="text-muted font-semibold">{error.environment}</span>
                </div>
              )}
              {error.user_id && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <User className="w-4 h-4 text-accent" />
                  <span className="text-muted/80 font-medium">User ID:</span>
                  <span className="text-muted font-semibold">{error.user_id}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorFeed
