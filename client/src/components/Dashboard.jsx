import { useState, useEffect } from 'react';
import { ErrorFeed } from './ErrorFeed';
import { CategoryChart } from './CategoryChart';
import { SpikeAlert } from './SpikeAlert';
import { formatErrorRate } from '../utils/formatters';

/**
 * Main dashboard component
 */
export function Dashboard({ connected, errors, stats, aiStreaming, spikes, onClearSpikes, requestStats }) {
  const [timeWindow, setTimeWindow] = useState('1h');

  const timeWindows = {
    '15m': 900000,
    '1h': 3600000,
    '24h': 86400000
  };

  useEffect(() => {
    requestStats(timeWindows[timeWindow]);
  }, [timeWindow, requestStats]);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark-text">
                ⚡ Error Intelligence Dashboard
              </h1>
              <p className="text-sm text-dark-muted mt-1">
                Real-time error monitoring powered by Gemini AI
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-dark-muted">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <select
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="bg-dark-bg border border-dark-border rounded px-3 py-2 text-sm"
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Errors"
            value={stats?.totalErrors || 0}
            icon="🔴"
          />
          <StatCard
            title="Error Rate"
            value={`${formatErrorRate(stats?.errorRate || 0)}/min`}
            icon="📊"
          />
          <StatCard
            title="Categories"
            value={stats?.categories?.length || 0}
            icon="📁"
          />
          <StatCard
            title="Active Errors"
            value={errors.length}
            icon="⚡"
          />
        </div>

        {/* Spike Alerts */}
        {spikes.length > 0 && (
          <div className="mb-6">
            <SpikeAlert spikes={spikes} onClear={onClearSpikes} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Error Feed - Takes 2 columns */}
          <div className="lg:col-span-2 h-[calc(100vh-300px)] min-h-[500px]">
            <ErrorFeed errors={errors} aiStreaming={aiStreaming} />
          </div>

          {/* Category Chart - Takes 1 column */}
          <div className="h-[calc(100vh-300px)] min-h-[500px]">
            <CategoryChart stats={stats} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-surface border-t border-dark-border mt-8">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-dark-muted">
            Built with React, Socket.io, and Gemini AI • Real-time error intelligence
          </p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-dark-muted mb-1">{title}</p>
          <p className="text-2xl font-bold text-dark-text">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

export default Dashboard;
