"use client"

import { AlertTriangle, X, TrendingUp, Activity } from "lucide-react"

interface SpikeData {
  source: string
  category: string
  message: string
  currentRate: number
  averageRate: number
}

interface SpikeAlertProps {
  spikes: SpikeData[]
  onClear?: () => void
}

export function SpikeAlert({ spikes, onClear }: SpikeAlertProps) {
  if (!spikes || spikes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
      {spikes.map((spike, index) => (
        <div
          key={`${spike.source}-${spike.category}-${index}`}
          className="glass-card rounded-xl border-destructive/40 p-5 flex items-start justify-between glow-primary animate-in fade-in slide-in-from-top-2 duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex-1 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-destructive/30 to-warning/30 pulse-glow">
              <AlertTriangle className="w-6 h-6 text-destructive animate-bounce" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg gradient-text">Spike Detected!</h3>
                <div className="px-2 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-bold uppercase">
                  Alert
                </div>
              </div>

              <p className="text-sm text-foreground/90 mb-4 leading-relaxed">{spike.message}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Source</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{spike.source}</span>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Category</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{spike.category}</span>
                </div>

                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-3 h-3 text-destructive" />
                    <span className="text-xs text-destructive uppercase tracking-wide">Current Rate</span>
                  </div>
                  <span className="text-sm font-bold text-destructive">{spike.currentRate} errors</span>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Baseline</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{spike.averageRate} errors</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onClear?.()
            }}
            className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-destructive/50 transition-all ml-4"
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default SpikeAlert
