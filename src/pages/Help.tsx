import React from 'react';
import { Card } from '@/components/ui/card';
import { HelpCircle, Sparkles, Server, Shield } from 'lucide-react';

const HelpPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Help & Architecture Guide</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Learn how Life Planner Assistant works and configure local integrations.
        </p>
      </div>

      <div className="space-y-4">
        <Card title="Ollama Local AI setup instructions">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
            To use the AI Advisor locally, install Ollama from{' '}
            <a href="https://ollama.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">
              ollama.com
            </a>{' '}
            and run:
          </p>
          <pre className="p-3 bg-gray-900 text-indigo-300 text-xs rounded-lg font-mono overflow-x-auto">
            ollama run llama3
          </pre>
        </Card>

        <Card title="Security & Privacy Policy">
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            All app data remains strictly local in local memory during scaffold phase. In future stages, database authentication will utilize Supabase Row Level Security (RLS) guaranteeing user-isolated persistence.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage;