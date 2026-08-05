import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { getTasks, subscribeToDataChanges, clearAllData } from '@/services/dataService';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar as CalendarIcon,
  Clock,
  CheckSquare,
  Wallet,
  FileText,
  Timer,
  Settings as SettingsIcon,
  HelpCircle,
  X,
  Sparkles,
  LogOut,
} from 'lucide-react';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [openTaskCount, setOpenTaskCount] = useState(0);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const refreshOpenTaskCount = () => {
    const tasks = getTasks();
    const openCount = tasks.filter((t) => !t.completed).length;
    setOpenTaskCount(openCount);
  };

  useEffect(() => {
    refreshOpenTaskCount();
    const unsubscribe = subscribeToDataChanges(refreshOpenTaskCount);
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      if (signOut) {
        await signOut();
      }
    } catch (e) {
      console.error('Error signing out:', e);
    }
    clearAllData();
    onClose();
    navigate('/login');
  };

  const organizeNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
    { name: 'Day Planner', path: '/day-planner', icon: Clock },
    { name: 'To-Do List', path: '/tasks', icon: CheckSquare, badge: openTaskCount },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Notes', path: '/notes', icon: FileText },
  ];

  const focusAndSystemItems = [
    { name: 'Pomodoro', path: '/pomodoro', icon: Timer },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        id="main-sidebar"
        aria-label="Sidebar Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-500 text-slate-950 rounded-lg font-bold" aria-hidden="true">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 tracking-tight block">
                Life Planner
              </span>
              <p className="text-[10px] text-teal-400 font-mono">Personal Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg lg:hidden hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none"
            aria-label="Close navigation sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Grouped Navigation */}
        <div className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {/* ORGANIZE Group */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Organize
            </p>
            <nav aria-label="Organize Navigation" className="space-y-1">
              {organizeNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
                        isActive
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                      }`
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={17} aria-hidden="true" />
                      <span>{item.name}</span>
                    </div>

                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-teal-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* FOCUS & SYSTEM Group */}
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Focus & System
            </p>
            <nav aria-label="Focus Navigation" className="space-y-1">
              {focusAndSystemItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onClose()}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
                        isActive
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                      }`
                    }
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer User Mode & Sign Out */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/70 space-y-2.5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-950 text-teal-400 border border-teal-800 flex items-center justify-center text-xs font-bold font-mono shrink-0">
              {user?.email ? user.email.substring(0, 2).toUpperCase() : 'LP'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.email || 'Local Workspace'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user ? 'Authenticated' : 'Offline / Standby'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 hover:text-rose-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 outline-none"
          >
            <LogOut size={14} />
            <span>Sign Out & Clear Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};