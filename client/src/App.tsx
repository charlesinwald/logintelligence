import { useSocket } from './hooks/useSocket';
import { Dashboard } from './components/Dashboard';

function App() {
  const { connected, errors, stats, aiStreaming, spikes, requestStats, clearSpikes } = useSocket();

  return (
    <Dashboard
      connected={connected}
      errors={errors}
      stats={stats}
      aiStreaming={aiStreaming}
      spikes={spikes}
      onClearSpikes={clearSpikes}
      requestStats={requestStats}
    />
  );
}

export default App;

