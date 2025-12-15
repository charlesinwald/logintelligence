"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ErrorFeed } from "./ErrorFeed"
import { CategoryChart } from "./CategoryChart"
import { SpikeAlert } from "./SpikeAlert"
import { Activity, BarChart3, Folder, Zap, Wifi, WifiOff } from "lucide-react"

interface DashboardProps {
  connected: boolean
  errors: unknown[]
  stats?: {
    totalErrors?: number
    errorRate?: number
    categories?: unknown[]
  }
  aiStreaming?: Record<string, string>
  spikes: unknown[]
  onClearSpikes: () => void
  requestStats: (timeWindow: number) => void
}

export function Dashboard({
  connected,
  errors,
  stats,
  aiStreaming,
  spikes,
  onClearSpikes,
  requestStats,
}: DashboardProps) {
  const [timeWindow, setTimeWindow] = useState("1h")

  const timeWindows: Record<string, number> = {
    "15m": 900000,
    "1h": 3600000,
    "24h": 86400000,
  }

  useEffect(() => {
    requestStats(timeWindows[timeWindow])
  }, [timeWindow, requestStats, timeWindows])

  const formatErrorRate = (rate: number) => {
    return rate.toFixed(2)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 glow-primary">
                <Zap className="w-8 h-8 text-primary" />
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
              >
                {connected ? (
                  <>
                    <Wifi className="w-4 h-4 text-success" />
                    <span className="text-sm font-medium text-success">Connected</span>
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse glow-accent" />
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-medium text-destructive">Disconnected</span>
                  </>
                )}
              </div>

              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="bg-muted/50 border border-primary/30 rounded-lg px-4 py-2 text-sm font-medium backdrop-blur-sm hover:border-primary/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Errors"
            value={stats?.totalErrors || 0}
            icon={<Activity className="w-8 h-8" />}
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
            <CategoryChart stats={stats as never} />
          </div>
        </div>
      </main>

      <footer className="glass-card border-t border-border/50 mt-8 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Built by <a href="https://charlesinwald.com" className="text-primary hover:underline">Charles Inwald</a>
          </p>
        </div>
      </footer>
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
    primary: "from-primary/20 to-primary/5 border-primary/40 text-primary glow-primary",
    secondary: "from-secondary/20 to-secondary/5 border-secondary/40 text-secondary glow-secondary",
    accent: "from-accent/20 to-accent/5 border-accent/40 text-accent glow-accent",
    warning: "from-warning/20 to-warning/5 border-warning/40 text-warning",
  }

  return (
    <div
      className={`glass-card rounded-xl p-6 border bg-gradient-to-br ${colorClasses[color]} hover:scale-105 transition-transform duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  )
}

export default Dashboard
