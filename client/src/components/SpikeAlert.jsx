import { formatRelativeTime } from '../utils/formatters';

/**
 * Spike alert component
 */
export function SpikeAlert({ spikes, onClear }) {
  if (!spikes || spikes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {spikes.map((spike, index) => (
        <div
          key={`${spike.source}-${spike.category}-${index}`}
          className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-red-400 text-2xl">🚨</span>
              <h3 className="font-semibold text-red-400">Spike Detected!</h3>
            </div>

            <p className="text-sm text-dark-text mb-2">{spike.message}</p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-dark-muted">Source:</span>{' '}
                <span className="text-dark-text font-semibold">{spike.source}</span>
              </div>
              <div>
                <span className="text-dark-muted">Category:</span>{' '}
                <span className="text-dark-text font-semibold">{spike.category}</span>
              </div>
              <div>
                <span className="text-dark-muted">Current Rate:</span>{' '}
                <span className="text-red-400 font-semibold">{spike.currentRate} errors</span>
              </div>
              <div>
                <span className="text-dark-muted">Baseline:</span>{' '}
                <span className="text-dark-text">{spike.averageRate} errors</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onClear && onClear()}
            className="text-dark-muted hover:text-dark-text ml-4"
            aria-label="Dismiss alert"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

export default SpikeAlert;
