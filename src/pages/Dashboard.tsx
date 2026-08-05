import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getEvents,
  getTimeBlocks,
  getTasks,
  getTransactions,
  getBudgets,
  getPomodoroSessions,
  toggleTaskComplete,
  toggleTimeBlockDone,
  subscribeToDataChanges,
} from '@/services/dataService';
import { getAppSettings } from '@/services/storageService';
import {
  formatCurrency,
  getTodayMergedAgenda,
  getTaskMetrics,
  getMonthlyFinanceMetrics,
  getTodayPomodoroMetrics,
} from '@/utils/selectors';
import { QuickAddModal } from '@/components/quick-add/QuickAddModal';
import {
  Calendar,
  CheckSquare,
  Wallet,
  Timer,
  Plus,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  PieChart,
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [settings] = useState(getAppSettings());

  // Reactive state
  const [events, setEvents] = useState(getEvents());
  const [timeBlocks, setTimeBlocks] = useState(getTimeBlocks());
  const [tasks, setTasks] = useState(getTasks());
  const [transactions, setTransactions] = useState(getTransactions());
  const [budgets, setBudgets] = useState(getBudgets());
  const [pomodoros, setPomodoros] = useState(getPomodoroSessions());

  // Quick Add Modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTab, setQuickAddTab] = useState<'schedule' | 'task' | 'expense'>('schedule');

  const refreshAllData = () => {
    setEvents(getEvents());
    setTimeBlocks(getTimeBlocks());
    setTasks(getTasks());
    setTransactions(getTransactions());
    setBudgets(getBudgets());
    setPomodoros(getPomodoroSessions());
  };

  useEffect(() => {
    refreshAllData();
    // Auto subscribe to data changes across all pages
    const unsubscribe = subscribeToDataChanges(refreshAllData);
    return unsubscribe;
  }, []);

  // Merged Chronological Agenda (Calendar Events + Day Planner Time Blocks)
  const todayAgenda = getTodayMergedAgenda(events, timeBlocks);
  const taskMetrics = getTaskMetrics(tasks);
  const financeMetrics = getMonthlyFinanceMetrics(transactions, budgets);
  const pomodoroMetrics = getTodayPomodoroMetrics(pomodoros);

  const handleToggleTask = (id: string) => {
    toggleTaskComplete(id);
  };

  const handleToggleTimeBlock = (id: string) => {
    toggleTimeBlockDone(id);
  };

  const openQuickAdd = (tab: 'schedule' | 'task' | 'expense') => {
    setQuickAddTab(tab);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-slate-100 rounded-lg p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <StatusBadge label="Executive Summary" variant="teal" size="sm" />
            <span className="text-xs text-slate-400 font-mono">Workspace: {settings.userName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-100">
            Daily Focus & Financial Snapshot
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time calculation of schedule, priority tasks, and budget status.
          </p>
        </div>

        {/* Quick Form Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => openQuickAdd('schedule')}
          >
            + Schedule
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => openQuickAdd('task')}
          >
            + Task
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => openQuickAdd('expense')}
          >
            + Expense
          </Button>
        </div>
      </div>

      {/* 1. Top KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Today's Schedule Count */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Today's Schedule</span>
              <h3 className="text-xl font-black text-slate-100">
                {todayAgenda.length} {todayAgenda.length === 1 ? 'Item' : 'Items'}
              </h3>
            </div>
            <div className="p-2.5 bg-sky-950/80 text-sky-400 border border-sky-800/50 rounded-lg">
              <Calendar size={20} aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 truncate">
            {todayAgenda.length > 0 ? `Next: ${todayAgenda[0].title}` : 'No events or blocks remaining today'}
          </p>
        </Card>

        {/* KPI 2: Open & Overdue Tasks */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Pending Tasks</span>
              <h3 className="text-xl font-black text-slate-100">
                {taskMetrics.openCount} Open
              </h3>
            </div>
            <div className="p-2.5 bg-teal-950/80 text-teal-300 border border-teal-800/50 rounded-lg">
              <CheckSquare size={20} aria-hidden="true" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px]">
            {taskMetrics.overdueCount > 0 ? (
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle size={12} aria-hidden="true" /> {taskMetrics.overdueCount} Overdue Item(s)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} aria-hidden="true" /> All deadlines on schedule
              </span>
            )}
          </div>
        </Card>

        {/* KPI 3: Current-Month Balance */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Monthly Balance</span>
              <h3 className="text-xl font-black text-slate-100">
                {formatCurrency(financeMetrics.netBalance, settings.currency)}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-950/80 text-amber-400 border border-amber-800/50 rounded-lg">
              <Wallet size={20} aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Spent: {formatCurrency(financeMetrics.totalExpense, settings.currency)}
          </p>
        </Card>

        {/* KPI 4: Today's Focus Sessions */}
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Focus Progress</span>
              <h3 className="text-xl font-black text-slate-100">
                {pomodoroMetrics.completedWorkSessions} / {pomodoroMetrics.dailyTarget} Cycles
              </h3>
            </div>
            <div className="p-2.5 bg-purple-950/80 text-purple-300 border border-purple-800/50 rounded-lg">
              <Timer size={20} aria-hidden="true" />
            </div>
          </div>
          <p className="text-[11px] text-purple-300 font-mono mt-2">
            {pomodoroMetrics.totalFocusMinutes} Focus Minutes Today
          </p>
        </Card>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Spans): Today's Merged Agenda & Priority Tasks */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* 2. Today's Merged Agenda */}
          <Card
            title="Today's Merged Chronological Agenda"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowUpRight size={14} />}
                onClick={() => (window.location.href = '/day-planner')}
              >
                Day Timeline
              </Button>
            }
          >
            {todayAgenda.length > 0 ? (
              <div className="divide-y divide-slate-800/60">
                {todayAgenda.map((item) => (
                  <div key={`${item.itemType}_${item.id}`} className="py-3.5 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {item.itemType === 'timeblock' ? (
                        <button
                          onClick={() => handleToggleTimeBlock(item.id)}
                          className="mt-0.5 text-slate-400 hover:text-teal-400 transition-colors shrink-0"
                          aria-label={`Toggle timeblock ${item.title}`}
                        >
                          {item.done ? (
                            <CheckCircle2 size={18} className="text-teal-400" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                      ) : (
                        <div className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-teal-400 font-mono text-xs font-bold shrink-0">
                          <Clock size={14} aria-hidden="true" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-xs sm:text-sm font-bold truncate ${
                              item.done ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {item.title}
                          </h3>
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{item.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 font-mono">
                          <span>{item.startTimeFormatted} - {item.endTimeFormatted}</span>
                          {item.location && <span>• {item.location}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded uppercase border ${
                          item.itemType === 'event'
                            ? 'bg-sky-950 text-sky-300 border-sky-800'
                            : 'bg-purple-950 text-purple-300 border-purple-800'
                        }`}
                      >
                        {item.itemType === 'event' ? 'Event' : 'Time Block'}
                      </span>
                      <StatusBadge label={item.category} variant="teal" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar size={24} />}
                title="No Agenda Items Scheduled Today"
                description="Your day timeline is clear. Add an event or focus block to get started."
                actionLabel="+ Add Event"
                onAction={() => openQuickAdd('schedule')}
              />
            )}
          </Card>

          {/* 3. Priority Tasks */}
          <Card
            title="Priority Action Items"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowUpRight size={14} />}
                onClick={() => (window.location.href = '/tasks')}
              >
                View All
              </Button>
            }
          >
            {taskMetrics.priorityTasks.length > 0 ? (
              <div className="divide-y divide-slate-800/60">
                {taskMetrics.priorityTasks.slice(0, 5).map((task) => {
                  const isOverdue =
                    task.dueDate && task.dueDate < new Date().toISOString().split('T')[0];

                  return (
                    <div key={task.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id)}
                          className="text-slate-400 hover:text-teal-400 transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none rounded-full"
                          aria-label={`Mark task ${task.title} as ${task.status === 'completed' ? 'pending' : 'completed'}`}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 size={18} className="text-teal-400" />
                          ) : (
                            <Circle size={18} />
                          )}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              task.status === 'completed'
                                ? 'line-through text-slate-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span>{task.category}</span>
                            {task.dueDate && <span>• Due: {task.dueDate}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isOverdue && <StatusBadge label="OVERDUE" variant="danger" size="sm" />}
                        <StatusBadge
                          label={task.priority.toUpperCase()}
                          variant={
                            task.priority === 'urgent'
                              ? 'danger'
                              : task.priority === 'high'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<CheckSquare size={24} />}
                title="All Priority Tasks Complete"
                description="Great job! You have no open priority action items remaining."
                actionLabel="+ Add Task"
                onAction={() => openQuickAdd('task')}
              />
            )}
          </Card>
        </div>

        {/* Right Column (1 Span): Budget Snapshot & Focus Progress */}
        <div className="space-y-6 min-w-0">
          {/* 4. Monthly Budget Snapshot */}
          <Card
            title="Monthly Budget Snapshot"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowUpRight size={14} />}
                onClick={() => (window.location.href = '/expenses')}
              >
                Ledger
              </Button>
            }
          >
            {financeMetrics.categoryBreakdown.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Budget Limit</span>
                    <span className="font-bold text-slate-200 font-mono">
                      {formatCurrency(financeMetrics.totalBudgetLimit, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total Spent</span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatCurrency(financeMetrics.totalExpense, settings.currency)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        financeMetrics.budgetUtilizationPercentage > 90
                          ? 'bg-rose-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${financeMetrics.budgetUtilizationPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Category Allocations
                  </p>
                  {financeMetrics.categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.category}</span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          {formatCurrency(item.spent, settings.currency)} / {formatCurrency(item.limit, settings.currency)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className="bg-amber-400 h-full transition-all"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<PieChart size={24} />}
                title="No Budgets Defined"
                description="Set monthly category limits in the Finance module to track spending."
              />
            )}
          </Card>

          {/* 5. Focus Progress */}
          <Card
            title="Focus Cycle Goal"
            headerAction={
              <Button
                variant="ghost"
                size="sm"
                icon={<ArrowUpRight size={14} />}
                onClick={() => (window.location.href = '/pomodoro')}
              >
                Timer
              </Button>
            }
          >
            <div className="space-y-4 text-center">
              <div className="p-4 bg-purple-950/30 border border-purple-900/40 rounded-lg space-y-2">
                <div className="text-2xl font-black text-purple-300 font-mono">
                  {pomodoroMetrics.completedWorkSessions} / {pomodoroMetrics.dailyTarget} Sessions
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-purple-500 h-full transition-all"
                    style={{ width: `${pomodoroMetrics.targetPercentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  {pomodoroMetrics.targetPercentage}% of daily focus goal completed
                </p>
              </div>

              <Button
                variant="purple"
                size="sm"
                icon={<Timer size={14} />}
                onClick={() => (window.location.href = '/pomodoro')}
                className="w-full"
              >
                Start Focus Session
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Universal Quick Add Drawer Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultTab={quickAddTab}
        onSuccess={refreshAllData}
      />
    </div>
  );
};

export default Dashboard;