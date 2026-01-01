"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { BarChart3, Loader2 } from "lucide-react"
import type { ErrorStatistics } from "../hooks/useSocket"

interface CategoryChartProps {
  stats?: ErrorStatistics | null
  isLoading?: boolean
}

export function CategoryChart({ stats, isLoading = false }: CategoryChartProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="glass-card h-full flex items-center justify-center rounded-xl neon-border">
        <div className="text-center">
          <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground text-base">Loading category data...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!stats || !stats.categories || stats.categories.length === 0) {
    return (
      <div className="glass-card h-full flex items-center justify-center rounded-xl neon-border">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-base mb-2">No category data available</p>
          <p className="text-sm text-muted-foreground/70">Category breakdowns will appear here once errors are detected</p>
        </div>
      </div>
    )
  }

  const chartData = stats.categories
    .filter((c) => c.category && c.category !== "null")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const getCategoryColor = (index: number) => {
    const colors = [
      "oklch(0.65 0.25 264)", // Primary blue
      "oklch(0.7 0.24 328)", // Secondary pink
      "oklch(0.75 0.22 180)", // Accent cyan
      "oklch(0.75 0.2 85)", // Warning yellow
      "oklch(0.6 0.25 25)", // Destructive red
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="glass-card h-full rounded-xl neon-border overflow-hidden">
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-secondary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-secondary/30 glow-secondary">
            <BarChart3 className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text">Error Categories</h2>
            <p className="text-sm text-muted-foreground">Top 10 by frequency</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-64 relative">
          <div className="absolute inset-0 scan-line pointer-events-none opacity-30" />
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.04 264 / 0.3)" vertical={false} />
              <XAxis
                dataKey="category"
                stroke="oklch(0.75 0 0)"
                tick={{ fill: "oklch(0.75 0 0)", fontSize: 12, fontWeight: 600 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="oklch(0.75 0 0)"
                tick={{ fill: "oklch(0.75 0 0)", fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.16 0.02 264 / 0.95)",
                  border: "2px solid oklch(0.65 0.25 264 / 0.6)",
                  borderRadius: "10px",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 25px oklch(0.65 0.25 264 / 0.4)",
                  backdropFilter: "blur(16px)",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
                cursor={{ fill: "oklch(0.25 0.04 264 / 0.5)" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryColor(index)}
                    style={{
                      filter: `drop-shadow(0 0 8px ${getCategoryColor(index)}40)`,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {chartData.map((cat, index) => (
            <div
              key={cat.category}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors border border-border/50"
            >
              <div
                className="w-4 h-4 rounded pulse-glow"
                style={{
                  backgroundColor: getCategoryColor(index),
                  boxShadow: `0 0 12px ${getCategoryColor(index)}70`,
                }}
              />
              <span className="text-base text-foreground truncate flex-1 font-medium">{cat.category}</span>
              <span className="text-base font-bold text-foreground">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryChart
