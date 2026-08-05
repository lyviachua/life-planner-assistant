import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  getTimeBlocksForDate,
  toggleTimeBlockDone,
  getDailyIntention,
  saveDailyIntention,
  getTasks,
  copyTimeBlocksToDate,
  getActiveDate,
  setActiveDate,
  subscribeToDataChanges,
} from '@/services/dataService';
import { TimeBlock, Task } from '@/types';
import { TimeBlockModal } from '@/components/day-planner/TimeBlockModal';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  Circle,
  Copy,
  Sparkles,
  Check,
  Calendar as CalendarIcon,
  Edit3,
} from 'lucide-react';

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 06:00 to 23:00

const DayPlannerPage: React.FC = () => {
  const [selectedDateStr, setSelectedDateStrState] = useState<string>(getActiveDate());
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [intentionText, setIntentionText] = useState('');
  const [intentionSaved, setIntentionSaved] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [blockToEdit, setBlockToEdit] = useState<TimeBlock | null>(null);
  const [defaultStartTime, setDefaultStartTime] = useState('09:00');
  const [defaultTaskId, setDefaultTaskId] = useState('');
  const [defaultTitle, setDefaultTitle] = useState('');

  const setSelectedDateStr = (dStr: string) => {
    setSelectedDateStrState(dStr);
    setActiveDate(dStr);
  };

  const refreshData = () => {
    const active = getActiveDate();
    if (active !== selectedDateStr) {
      setSelectedDateStrState(active);
    }
    setTimeBlocks(getTimeBlocksForDate(active));
    setIntentionText(getDailyIntention(active));
    setTasks(getTasks().filter((t) => t.status !== 'completed'));
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDataChanges(refreshData);
    return unsubscribe;
  }, [selectedDateStr]);

  const handleIntentionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setIntentionText(val);
    saveDailyIntention(selectedDateStr, val);
    setIntentionSaved(true);
    setTimeout(() => setIntentionSaved(false), 2000);
  };

  const handlePrevDay = () => {
    const d = new Date(`${selectedDateStr}T00:00:00`);
    d.setDate(d.getDate() - 1);
    setSelectedDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDateStr}T00:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDateStr(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  const handleCopyTomorrow = () => {
    const today = new Date(`${selectedDateStr}T00:00:00`);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (
      window.confirm(
        `Copy all ${timeBlocks.length} time block(s) from ${selectedDateStr} to ${tomorrowStr}?`
      )
    ) {
      const count = copyTimeBlocksToDate(selectedDateStr, tomorrowStr);
      alert(`Successfully duplicated ${count} time block(s) to ${tomorrowStr}!`);
    }
  };

  const handleToggleDone = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTimeBlockDone(id);
  };

  const openCreateModalForHour = (hour: number) => {
    const formattedHour = String(hour).padStart(2, '0') + ':00';
    setBlockToEdit(null);
    setDefaultStartTime(formattedHour);
    setDefaultTaskId('');
    setDefaultTitle('');
    setIsModalOpen(true);
  };

  const openEditModal = (tb: TimeBlock) => {
    setBlockToEdit(tb);
    setIsModalOpen(true);
  };

  const handlePlanTask = (task: Task) => {
    setBlockToEdit(null);
    setDefaultTaskId(task.id);
    setDefaultTitle(task.title);
    setDefaultStartTime('09:00');
    setIsModalOpen(true);
  };

  const getCategoryBg = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'focus':
        return 'bg-purple-950/80 border-purple-800/80 text-purple-200';
      case 'work':
        return 'bg-teal-950/80 border-teal-800/80 text-teal-200';
      case 'meeting':
        return 'bg-sky-950/80 border-sky-800/80 text-sky-200';
      case 'routine':
        return 'bg-amber-950/80 border-amber-800/80 text-amber-200';
      case 'health':
        return 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="text-teal-400" size={22} />
            Daily Timeline Planner
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            24-hour hour-by-hour time blocking for targeted focus.
          </p>
        </div>

        {/* Date Navigation & Copy Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs font-semibold">
            Today
          </Button>

          <div className="flex items-center space-x-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950">
            <button
              onClick={handlePrevDay}
              aria-label="Previous Day"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-mono outline-none px-2 py-1"
            />
            <button
              onClick={handleNextDay}
              aria-label="Next Day"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={<Copy size={14} />}
            onClick={handleCopyTomorrow}
            title="Copy current day blocks to tomorrow"
          >
            Copy to Tomorrow
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => openCreateModalForHour(9)}
          >
            + Add Block
          </Button>
        </div>
      </div>

      {/* Daily Intention Text Box */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wider shrink-0 font-mono">
            <Sparkles size={16} /> Daily Intention:
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="e.g. Focus on Q3 financial audit & system documentation clarity..."
              value={intentionText}
              onChange={handleIntentionChange}
              className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:ring-1 focus:ring-teal-500 outline-none"
            />
          </div>
          <div className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 h-6">
            {intentionSaved && (
              <>
                <Check size={14} />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Timeline View */}
        <div className="lg:col-span-2 space-y-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800/80">
            {HOURS.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, '0')}:00`;
              const blocksInHour = timeBlocks.filter((tb) => {
                const [h] = tb.startTime.split(':').map(Number);
                return h === hour;
              });

              return (
                <div
                  key={hour}
                  className="group flex items-start p-2.5 sm:p-3 hover:bg-slate-800/30 transition-colors min-h-[64px]"
                >
                  <div className="w-16 shrink-0 text-xs font-mono font-semibold text-slate-400 pt-1">
                    {hourLabel}
                  </div>

                  <div className="flex-1 min-w-0 pl-2 space-y-2">
                    {blocksInHour.length > 0 ? (
                      blocksInHour.map((tb) => (
                        <div
                          key={tb.id}
                          onClick={() => openEditModal(tb)}
                          className={`p-2.5 rounded-lg border flex items-start justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] ${getCategoryBg(
                            tb.category
                          )} ${tb.done ? 'opacity-50' : ''}`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <button
                              onClick={(e) => handleToggleDone(tb.id, e)}
                              className="text-slate-400 hover:text-teal-400 transition-colors shrink-0 pt-0.5"
                              aria-label="Toggle completed"
                            >
                              {tb.done ? (
                                <CheckCircle2 size={16} className="text-teal-400" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h2
                                  className={`text-xs sm:text-sm font-bold truncate ${
                                    tb.done ? 'line-through text-slate-400' : 'text-slate-100'
                                  }`}
                                >
                                  {tb.title}
                                </h2>
                              </div>
                              {tb.notes && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {tb.notes}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                                <span>
                                  {tb.startTime} - {tb.endTime}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge label={tb.category} variant="teal" size="sm" />
                            <Edit3 size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        onClick={() => openCreateModalForHour(hour)}
                        className="h-8 border border-dashed border-slate-800/60 rounded-lg flex items-center px-3 text-[11px] text-slate-400 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:border-teal-500/50 hover:text-teal-400"
                      >
                        + Schedule time block for {hourLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Unscheduled Task Pool */}
        <div className="space-y-6">
          <Card title="Unscheduled Task Pool" subtitle="Drag or plan open priorities into your daily timeline">
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold text-slate-200 truncate">{task.title}</h2>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {task.category} • {task.priority.toUpperCase()} priority
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlanTask(task)}
                      className="text-[10px] py-1 px-2 shrink-0"
                    >
                      Plan Task
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarIcon size={22} />}
                title="Task Pool Empty"
                description="All pending tasks are scheduled or complete."
              />
            )}
          </Card>
        </div>
      </div>

      {/* Time Block Dialog Modal */}
      <TimeBlockModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        blockToEdit={blockToEdit}
        defaultDateStr={selectedDateStr}
        defaultStartTime={defaultStartTime}
        defaultTaskId={defaultTaskId}
        defaultTitle={defaultTitle}
        onSuccess={refreshData}
      />
    </div>
  );
};

export default DayPlannerPage;