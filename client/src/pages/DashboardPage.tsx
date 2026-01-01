import { useSocket } from '../hooks/useSocket';
import { useConfig } from '../hooks/useConfig';
import { Dashboard } from '../components/Dashboard';

export function DashboardPage() {
  const { config, updateConfig, resetConfig, getSocketUrl } = useConfig();
  const {
    connected,
    errors,
    stats,
    aiStreaming,
    spikes,
    requestStats,
    clearSpike,
    clearErrors,
    hideError,
    reconnect,
  } = useSocket(getSocketUrl());

  return (
    <Dashboard
      connected={connected}
      errors={errors}
      stats={stats}
      aiStreaming={aiStreaming}
      spikes={spikes}
      onClearSpike={clearSpike}
      onClearErrors={clearErrors}
      onHideError={hideError}
      requestStats={requestStats}
      config={config}
      onUpdateConfig={updateConfig}
      onResetConfig={resetConfig}
      onReconnect={reconnect}
    />
  );
}
