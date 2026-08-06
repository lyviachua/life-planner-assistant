import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/button';
import { getAppSettings, saveAppSettings } from '@/services/storageService';
import { loadSampleData, clearAllData } from '@/services/dataService';
import { testOllamaConnection } from '@/services/ollamaService';
import { AiContextMode } from '@/types';
import { Save, RefreshCw, Trash2, Cpu, CheckCircle2, AlertTriangle, Sparkles, Server } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState(getAppSettings());
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Test Connection State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; error?: string; models?: string[] } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testOllamaConnection(settings.ollamaEndpoint);
    setIsTesting(false);
    setTestResult(res);

    if (res.success && res.models.length > 0) {
      if (!res.models.includes(settings.ollamaModel)) {
        setSettings((prev) => ({ ...prev, ollamaModel: res.models[0] }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveAppSettings(settings);
    setSavedMessage('Settings updated successfully!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleLoadSampleData = () => {
    loadSampleData();
    setSavedMessage('Synthetic demo data loaded!');
    setTimeout(() => {
      setSavedMessage(null);
      window.location.href = '/';
    }, 1000);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      clearAllData();
      setSavedMessage('All data cleared!');
      setTimeout(() => {
        setSavedMessage(null);
        window.location.href = '/';
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Application Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure local Ollama AI endpoints, context parameters, and workspace preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Ollama Local AI Configuration */}
        <Card title="Ollama AI Advisor Configuration" subtitle="Local LLM endpoint and context window settings">
          <div className="space-y-4">
            <FormField label="Ollama Endpoint URL" helpText="Default local endpoint is http://localhost:11434">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.ollamaEndpoint}
                  onChange={(e) => setSettings({ ...settings, ollamaEndpoint: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="shrink-0 text-xs"
                >
                  {isTesting ? <RefreshCw size={14} className="animate-spin" /> : 'Test Connection'}
                </Button>
              </div>
            </FormField>

            {/* Connection Test Result Feedback Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">
                    {testResult.success
                      ? `Connected to Ollama! Found ${testResult.models?.length || 0} local model(s).`
                      : 'Connection Failed'}
                  </p>
                  {testResult.error && <p className="text-[11px] text-rose-200">{testResult.error}</p>}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Model Selection">
                {testResult?.models && testResult.models.length > 0 ? (
                  <select
                    value={settings.ollamaModel}
                    onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  >
                    {testResult.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="e.g. llama3, mistral, or phi3"
                    value={settings.ollamaModel}
                    onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  />
                )}
              </FormField>

              <FormField label="Default Context Mode">
                <select
                  value={settings.contextMode}
                  onChange={(e) => setSettings({ ...settings, contextMode: e.target.value as AiContextMode })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="today">Today Schedule & Priorities</option>
                  <option value="current">Current Active Route Page</option>
                  <option value="tasks">Open Action Tasks</option>
                  <option value="finance">Finance & Budget Ledger</option>
                  <option value="notes">Notes (With Bodies)</option>
                  <option value="full">Full Workspace Context</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label={`Temperature (${settings.temperature})`} helpText="Lower = deterministic; Higher = creative">
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-teal-500 bg-slate-950"
                />
              </FormField>

              <FormField label="Context Window Size (Tokens)">
                <select
                  value={settings.contextWindow}
                  onChange={(e) => setSettings({ ...settings, contextWindow: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                >
                  <option value={2048}>2048 Tokens</option>
                  <option value={4096}>4096 Tokens (Recommended)</option>
                  <option value={8192}>8192 Tokens</option>
                </select>
              </FormField>
            </div>
          </div>
        </Card>

        {/* User Preferences */}
        <Card title="User Preferences" subtitle="General application workspace default options">
          <div className="space-y-4">
            <FormField label="Display Name">
              <input
                type="text"
                value={settings.userName}
                onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </FormField>

            <FormField label="Default Currency Symbol">
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="MYR">MYR (RM)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </FormField>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <Button type="submit" variant="primary" icon={<Save size={16} />}>
            Save Settings
          </Button>
          {savedMessage && (
            <span className="text-xs text-emerald-400 font-semibold">
              {savedMessage}
            </span>
          )}
        </div>
      </form>

      {/* Demo Data Controls */}
      <Card title="Data Management" subtitle="Load synthetic demo data or reset workspace state">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={handleLoadSampleData}
          >
            Load Sample Data
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            icon={<Trash2 size={14} />}
            onClick={handleClearData}
          >
            Clear All Data
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;