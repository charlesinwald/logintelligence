import { useState } from 'react';
import { X, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import type { AppConfig } from '../hooks/useConfig';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onUpdateConfig: (updates: Partial<AppConfig>) => void;
  onResetConfig: () => void;
  onReconnect: () => void;
}

export function Settings({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onResetConfig,
  onReconnect
}: SettingsProps) {
  const [serverUrl, setServerUrl] = useState(config.serverUrl);
  const [port, setPort] = useState(config.port.toString());

  if (!isOpen) return null;

  const handleSave = () => {
    const portNum = parseInt(port, 10);
    if (!isNaN(portNum) && portNum > 0 && portNum <= 65535) {
      onUpdateConfig({
        serverUrl: serverUrl.trim(),
        port: portNum
      });
      onReconnect();
      onClose();
    }
  };

  const handleReset = () => {
    onResetConfig();
    setServerUrl('localhost');
    setPort('3000');
    onReconnect();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-card rounded-2xl border border-primary/30 p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 glow-primary">
              <SettingsIcon className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold gradient-text">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="server-url" className="block text-sm font-medium text-accent mb-2">
              Server URL
            </label>
            <input
              id="server-url"
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="localhost"
              className="w-full bg-muted/50 border border-primary/30 rounded-lg px-4 py-3 text-sm font-medium backdrop-blur-sm hover:border-primary/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The server hostname or IP address
            </p>
          </div>

          <div>
            <label htmlFor="port" className="block text-sm font-medium text-accent mb-2">
              Port
            </label>
            <input
              id="port"
              type="number"
              min="1"
              max="65535"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              placeholder="3000"
              className="w-full bg-muted/50 border border-primary/30 rounded-lg px-4 py-3 text-sm font-medium backdrop-blur-sm hover:border-primary/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Port number (1-65535)
            </p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity glow-primary"
            >
              Save & Reconnect
            </button>
            <button
              onClick={handleReset}
              className="p-3 rounded-lg border border-primary/30 hover:bg-muted/50 transition-colors"
              aria-label="Reset to defaults"
              title="Reset to defaults"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Current connection: <span className="font-mono text-primary">http://{config.serverUrl}:{config.port}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
