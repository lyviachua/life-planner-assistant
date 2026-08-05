import { AppSettings } from '@/types';

const SETTINGS_KEY = 'life_planner_settings_v1';

const defaultSettings: AppSettings = {
  userName: 'Planner User',
  currency: 'USD',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3',
  temperature: 0.7,
  contextWindow: 4096,
  contextMode: 'today',
  theme: 'system',
};

export const getAppSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveAppSettings = (settings: Partial<AppSettings>): AppSettings => {
  const current = getAppSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save settings to localStorage:', err);
  }
  return updated;
};