import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AIAdvisorPanel } from './AIAdvisorPanel';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Left Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onToggleAiPanel={() => setIsAiPanelOpen(!isAiPanelOpen)}
          isAiPanelOpen={isAiPanelOpen}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Central Workspace Container */}
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full overflow-y-auto">
            {children}
          </main>

          {/* Collapsible AI Advisor Panel */}
          <AIAdvisorPanel
            isOpen={isAiPanelOpen}
            onClose={() => setIsAiPanelOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};