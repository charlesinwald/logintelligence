"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { BarChart3 } from "lucide-react"

interface CategoryData {
  category: string
  count: number
}

interface StatsData {
  categories?: CategoryData[]
}

interface CategoryChartProps {
  stats?: StatsData
}

export function CategoryChart({ stats }: CategoryChartProps) {
  if (!stats || !stats.categories || stats.categories.length === 0) {
    return (
      <div className="glass-card h-full flex items-center justify-center rounded-xl neon-border">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No category data available</p>
        </div>
      </div>
    )
  }

  const chartData = stats.categories
    .filter((c) => c.category && c.category !== "null")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const getCategoryColor = (category: string, index: number) => {
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
          <div className="p-2 rounded-lg bg-secondary/20 glow-secondary">
            <BarChart3 className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text">Error Categories</h2>
            <p className="text-xs text-muted-foreground">Top 10 by frequency</p>
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
                stroke="oklch(0.65 0.05 264)"
                tick={{ fill: "oklch(0.65 0.05 264)", fontSize: 11, fontWeight: 500 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="oklch(0.65 0.05 264)"
                tick={{ fill: "oklch(0.65 0.05 264)", fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.12 0.02 264)",
                  border: "1px solid oklch(0.65 0.25 264 / 0.5)",
                  borderRadius: "8px",
                  color: "oklch(0.98 0 0)",
                  boxShadow: "0 0 20px oklch(0.65 0.25 264 / 0.3)",
                  backdropFilter: "blur(12px)",
                }}
                cursor={{ fill: "oklch(0.25 0.04 264 / 0.5)" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getCategoryColor(entry.category, index)}
                    style={{
                      filter: `drop-shadow(0 0 8px ${getCategoryColor(entry.category, index)}40)`,
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
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div
                className="w-3 h-3 rounded pulse-glow"
                style={{
                  backgroundColor: getCategoryColor(cat.category, index),
                  boxShadow: `0 0 10px ${getCategoryColor(cat.category, index)}60`,
                }}
              />
              <span className="text-sm text-foreground/90 truncate flex-1">{cat.category}</span>
              <span className="text-sm font-bold text-foreground">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CategoryChart
