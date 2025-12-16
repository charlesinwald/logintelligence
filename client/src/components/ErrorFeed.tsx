"use client"

import { useState } from "react"
import { AlertCircle, Activity, Clock, User, Hash } from "lucide-react"

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
    <div className="glass-card h-full flex flex-col rounded-xl overflow-hidden neon-border">
      <div className="flex items-center justify-between p-6 border-b border-border/50 bg-gradient-to-r from-primary/0 to-secondary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 glow-primary">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text">Live Error Feed</h2>
            <p className="text-xs text-muted-foreground">Real-time monitoring</p>
          </div>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-muted/50 border border-primary/30 rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-sm hover:border-primary/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 relative">
        <div className="absolute inset-0 scan-line pointer-events-none" />
        {filteredErrors.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
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
  const severity = error.ai_severity || error.severity || "unknown"
  const category = error.ai_category || "Processing..."
  const isProcessing = error.ai_status === "processing"

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
      className={`border rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isExpanded
          ? "bg-gradient-to-br from-muted/60 to-muted/30 border-primary/60 glow-primary"
          : "glass-card hover:border-primary/40"
      }`}
      onClick={onToggle}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r ${getSeverityColor(
                  severity,
                )}`}
              >
                {severity}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/20 text-secondary border border-secondary/30">
                {category}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{error.source}</span>
              {isProcessing && (
                <span className="flex items-center gap-1 text-xs text-accent animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-accent glow-accent" />
                  AI Analyzing...
                </span>
              )}
            </div>

            <p className="text-sm font-mono text-foreground/90 mb-2 leading-relaxed">
              {isExpanded ? error.message : error.message.slice(0, 120) + (error.message.length > 120 ? "..." : "")}
            </p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(error.timestamp).toLocaleTimeString()}
              </span>
              <span>{new Date(error.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            {error.ai_hypothesis && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" />
                  AI Analysis
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">{error.ai_hypothesis}</p>
              </div>
            )}

            {aiStreamingText && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 pulse-glow">
                <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" />
                  Streaming Analysis...
                </h4>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{aiStreamingText}</p>
              </div>
            )}

            {error.stack_trace && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <h4 className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">Stack Trace</h4>
                <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto text-destructive/90 leading-relaxed">
                  {error.stack_trace}
                </pre>
              </div>
            )}

            {error.metadata && Object.keys(error.metadata).length > 0 && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Metadata</h4>
                <pre className="text-xs font-mono bg-background/50 p-3 rounded overflow-x-auto text-foreground/80 leading-relaxed">
                  {JSON.stringify(error.metadata, null, 2)}
                </pre>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              {error.environment && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                  <Hash className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="text-foreground font-medium">{error.environment}</span>
                </div>
              )}
              {error.user_id && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                  <User className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="text-foreground font-medium">{error.user_id}</span>
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
