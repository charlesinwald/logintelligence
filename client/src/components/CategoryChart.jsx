import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getCategoryColor } from '../utils/formatters';

/**
 * Category breakdown chart component
 */
export function CategoryChart({ stats }) {
  if (!stats || !stats.categories || stats.categories.length === 0) {
    return (
      <div className="card h-full flex items-center justify-center">
        <p className="text-dark-muted">No category data available</p>
      </div>
    );
  }

  const chartData = stats.categories
    .filter(c => c.category && c.category !== 'null')
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 categories

  return (
    <div className="card h-full">
      <h2 className="text-xl font-semibold mb-4">Error Categories</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="category"
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#e2e8f0'
              }}
              cursor={{ fill: '#334155' }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category, index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.map((cat, index) => (
          <div key={cat.category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: getCategoryColor(cat.category, index) }}
            />
            <span className="text-sm text-dark-text truncate">
              {cat.category}: <span className="font-semibold">{cat.count}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryChart;
