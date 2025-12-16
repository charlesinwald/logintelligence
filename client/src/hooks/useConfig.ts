import { useState, useEffect, useCallback } from 'react';

export interface AppConfig {
  serverUrl: string;
  port: number;
}

const DEFAULT_CONFIG: AppConfig = {
  serverUrl: 'localhost',
  port: 3000
};

const CONFIG_STORAGE_KEY = 'logintelligence_config';

/**
 * Hook for managing application configuration with localStorage persistence
 */
export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load config from localStorage:', error);
    }
    return DEFAULT_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<AppConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
  }, []);

  const getSocketUrl = useCallback(() => {
    return `http://${config.serverUrl}:${config.port}`;
  }, [config]);

  return {
    config,
    updateConfig,
    resetConfig,
    getSocketUrl
  };
}

export default useConfig;
