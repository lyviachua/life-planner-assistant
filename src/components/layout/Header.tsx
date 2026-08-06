import React, { useState, useEffect } from 'react';
import { Menu, Bot, Plus, Calendar, Clock, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resetActiveDateToToday } from '@/services/dataService';
import { QuickAddModal } from '../quick-add/QuickAddModal';
import { useAuth } from '@/context/AuthContext';

export interface HeaderProps {
  onOpenSidebar: () => void;
  onToggleAiPanel: () => void;
  isAiPanelOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onToggleAiPanel,
  isAiPanelOpen,
}) => {
  const [now, setNow] = useState(new Date());
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { user, signOut, isConfigured } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleResetToday = () => {
    resetActiveDateToToday();
    if (window.location.pathname !== '/day-planner' && window.location.pathname !== '/calendar') {
      window.location.href = '/day-planner';
    }
  };

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 flex items-center justify-between text-slate-100">
        {/* Left: App Branding & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSidebar}
            aria-label="Open navigation sidebar"
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg lg:hidden hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-400 outline-none"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-lg hidden sm:flex items-center justify-center">
              <Sparkles size={16} aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-100">
              Life Planner <span className="text-teal-400 text-xs font-semibold font-mono ml-1">v1.0</span>
            </span>
          </div>
        </div>

        {/* Center/Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div
            aria-label="Current Date and Time"
            className="hidden md:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-medium"
          >
            <Calendar size={14} className="text-teal-400" />
            <span className="text-slate-200">{formattedDate}</span>
            <span className="text-slate-600">|</span>
            <Clock size={14} className="text-sky-400" />
            <span className="font-mono text-slate-200">{formattedTime}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={<Calendar size={14} />}
            onClick={handleResetToday}
            className="hidden sm:inline-flex text-xs"
          >
            Today
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsQuickAddOpen(true)}
          >
            <span className="hidden sm:inline">Quick Add</span>
            <span className="sm:hidden">Add</span>
          </Button>

          {isConfigured && user && (
            <div className="flex items-center space-x-2 border-l border-slate-800 pl-2">
              <span className="text-xs text-slate-300 font-mono hidden xl:inline">
                {user.email}
              </span>
              <button
                onClick={signOut}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <button
            onClick={onToggleAiPanel}
            aria-expanded={isAiPanelOpen}
            aria-label="Toggle AI Advisor Panel"
            className={`p-2 rounded-lg border transition-all flex items-center space-x-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-purple-400 outline-none ${
              isAiPanelOpen
                ? 'bg-purple-950/80 border-purple-800/80 text-purple-300'
                : 'border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            <Bot size={18} className="text-purple-400" />
            <span className="hidden lg:inline">AI Advisor</span>
          </button>
        </div>
      </header>

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </>
  );
};