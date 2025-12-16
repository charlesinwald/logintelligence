import { useSocket } from './hooks/useSocket';
import { useConfig } from './hooks/useConfig';
import { Dashboard } from './components/Dashboard';

function App() {
  const { config, updateConfig, resetConfig, getSocketUrl } = useConfig();
  const { connected, errors, stats, aiStreaming, spikes, requestStats, clearSpikes, reconnect } = useSocket(getSocketUrl());

  return (
    <Dashboard
      connected={connected}
      errors={errors}
      stats={stats}
      aiStreaming={aiStreaming}
      spikes={spikes}
      onClearSpikes={clearSpikes}
      requestStats={requestStats}
      config={config}
      onUpdateConfig={updateConfig}
      onResetConfig={resetConfig}
      onReconnect={reconnect}
    />
  );
}

export default App;

