import type React from "react"

import { useState, useEffect } from "react"
import { ErrorFeed } from "./ErrorFeed"
import { CategoryChart } from "./CategoryChart"
import { SpikeAlert } from "./SpikeAlert"
import { Settings } from "./Settings"
import { Activity, BarChart3, Folder, Zap, Wifi, WifiOff, Settings as SettingsIcon, Loader2, ChevronDown } from "lucide-react"
import { DottedSurface } from "./ui/dotted-surface"
import type { AppConfig } from "../hooks/useConfig"
import type { ErrorStatistics } from "../hooks/useSocket"

interface DashboardProps {
  connected: boolean
  errors: unknown[]
  stats: ErrorStatistics | null
  aiStreaming?: Record<string, string>
  spikes: unknown[]
  onClearSpikes: () => void
  requestStats: (timeWindow: number) => void
  config: AppConfig
  onUpdateConfig: (updates: Partial<AppConfig>) => void
  onResetConfig: () => void
  onReconnect: () => void
}

const timeWindows: Record<string, number> = {
  "15m": 900000,
  "1h": 3600000,
  "24h": 86400000,
}

export function Dashboard({
  connected,
  errors,
  stats,
  aiStreaming,
  spikes,
  onClearSpikes,
  requestStats,
  config,
  onUpdateConfig,
  onResetConfig,
  onReconnect,
}: DashboardProps) {
  const [timeWindow, setTimeWindow] = useState("1h")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  useEffect(() => {
    setIsLoadingStats(true)
    requestStats(timeWindows[timeWindow])
    // Reset loading state after a short delay as fallback
    const timer = setTimeout(() => setIsLoadingStats(false), 2000)
    return () => clearTimeout(timer)
  }, [timeWindow, requestStats])

  // Clear loading state when stats are received
  useEffect(() => {
    if (stats !== null) {
      setIsLoadingStats(false)
    }
  }, [stats])

  const formatErrorRate = (rate: number) => {
    return rate.toFixed(2)
  }

  return (
    <div className="min-h-screen">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>
      <DottedSurface theme="dark" />
      <header className="glass-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl" role="banner">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-glow-primary/30 to-glow-secondary/30 glow-primary">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text text-balance">LogIntelligence</h1>
                <p className="text-sm text-muted-foreground mt-1">Real-time monitoring powered by AI</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  connected
                    ? "bg-success/20 border border-success/40"
                    : "bg-destructive/20 border border-destructive/40"
                }`}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-success" aria-hidden="true" />
                    <span className="text-sm font-medium text-success">Connected</span>
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse glow-accent" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-destructive" aria-hidden="true" />
                    <span className="text-sm font-medium text-destructive">Disconnected</span>
                  </>
                )}
              </div>

              <div className="relative">
                <select
                  value={timeWindow}
                  onChange={(e) => setTimeWindow(e.target.value)}
                  className="appearance-none bg-muted/70 border-2 border-primary/40 rounded-lg pl-5 pr-12 py-2.5 text-base font-semibold backdrop-blur-sm hover:border-primary/70 hover:bg-muted/90 transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 cursor-pointer"
                  aria-label="Select time window"
                >
                  <option value="15m">Last 15 minutes</option>
                  <option value="1h">Last hour</option>
                  <option value="24h">Last 24 hours</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1">
                  {isLoadingStats ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary" />
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-3 rounded-lg bg-muted/70 border-2 border-primary/40 hover:border-primary/70 hover:bg-muted/90 transition-all"
                aria-label="Open settings"
              >
                <SettingsIcon className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-6" role="main">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" role="region" aria-label="Error statistics">
          <StatCard
            title="Total Errors"
            value={stats?.totalErrors || 0}
            icon={<Activity className="w-8 h-8 text-white" />}
            color="primary"
          />
          <StatCard
            title="Error Rate"
            value={`${formatErrorRate(stats?.errorRate || 0)}/min`}
            icon={<BarChart3 className="w-8 h-8" />}
            color="secondary"
          />
          <StatCard
            title="Categories"
            value={stats?.categories?.length || 0}
            icon={<Folder className="w-8 h-8" />}
            color="accent"
          />
          <StatCard title="Active Errors" value={errors.length} icon={<Zap className="w-8 h-8" />} color="warning" />
        </div>

        {/* Spike Alerts */}
        {spikes.length > 0 && (
          <div className="mb-6">
            <SpikeAlert spikes={spikes as never[]} onClear={onClearSpikes} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-[calc(100vh-300px)] min-h-[500px]">
            <ErrorFeed errors={errors as never[]} aiStreaming={aiStreaming} />
          </div>
          <div className="h-[calc(100vh-300px)] min-h-[500px]">
            <CategoryChart stats={stats} isLoading={isLoadingStats} />
          </div>
        </div>
      </main>

      <footer className="glass-card border-t border-border/50 mt-8 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted">
            Built by <a href="https://charlesinwald.com" className="text-card/80 cursor-pointer underline">Charles Inwald</a>
          </p>
        </div>
      </footer>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={onUpdateConfig}
        onResetConfig={onResetConfig}
        onReconnect={onReconnect}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}) {
  const colorClasses: Record<string, string> = {
    primary: "from-secondary/30 to-primary/10 border-primary/50 text-primary glow-primary",
    secondary: "from-secondary/30 to-secondary/10 border-secondary/50 text-secondary glow-secondary",
    accent: "from-accent/30 to-accent/10 border-accent/50 text-accent glow-accent",
    warning: "from-warning/30 to-warning/10 border-warning/50 text-warning",
  }

  return (
    <div
      className={`glass-card rounded-xl p-6 border-2 bg-linear-to-br ${colorClasses[color]} hover:scale-105 transition-transform duration-300`}
      role="article"
      aria-label={`${title}: ${value}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-4xl font-bold gradient-text" aria-label={`${value}`}>{value}</p>
        </div>
        <div className={`p-4 rounded-xl bg-linear-to-br ${colorClasses[color]}`} aria-hidden="true">{icon}</div>
      </div>
    </div>
  )
}

export default Dashboard
