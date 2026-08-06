import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePomodoroTimer, TimerMode } from '@/hooks/usePomodoroTimer';
import {
  getTasks,
  getPomodoroSessions,
  subscribeToDataChanges,
} from '@/services/dataService';
import { Task, PomodoroSession } from '@/types';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Flame,
  Clock,
} from 'lucide-react';

const PomodoroPage: React.FC = () => {
  const {
    mode,
    status,
    remainingSeconds,
    cycleCount,
    linkedTaskId,
    progressPercentage,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    changeMode,
    updateLinkedTaskId,
  } = usePomodoroTimer();

  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);

  const refreshData = () => {
    setOpenTasks(getTasks().filter((t) => !t.completed));
    setSessions(getPomodoroSessions());
  };

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToDataChanges(refreshData);
    return unsubscribe;
  }, []);

  // Format MM:SS
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Get linked task title
  const activeTask = openTasks.find((t) => t.id === linkedTaskId);

  // Today's stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(
    (s) => new Date(s.completedAt).toISOString().split('T')[0] === todayStr
  );

  const todayWorkSessions = todaySessions.filter((s) => s.type === 'work');
  const todayTotalMinutes = todayWorkSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Timer className="text-purple-400" size={22} />
            Pomodoro Focus Timer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            25-minute focus cycles, structured breaks, and task-linked time logging.
          </p>
        </div>

        {/* 4-Cycle Tracker Indicators */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="text-xs font-mono text-slate-400">Cycles:</span>
          <div className="flex items-center space-x-1.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3 h-3 rounded-full border transition-all ${
                  idx < cycleCount
                    ? 'bg-purple-500 border-purple-400 shadow-xs shadow-purple-500/50'
                    : 'bg-slate-900 border-slate-800'
                }`}
                title={`Cycle ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-purple-300 font-bold ml-1">
            {cycleCount}/4
          </span>
        </div>
      </div>

      {/* Main Focus Center Timer Card */}
      <Card padding="lg" className="text-center relative overflow-hidden border-purple-900/30">
        {/* Top Mode Navigation Tabs */}
        <div className="flex items-center justify-center space-x-2 mb-8 border-b border-slate-800/80 pb-4">
          <button
            onClick={() => changeMode('work')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'work'
                ? 'bg-purple-950 text-purple-300 border border-purple-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Work (25m)
          </button>
          <button
            onClick={() => changeMode('short_break')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'short_break'
                ? 'bg-teal-950 text-teal-300 border border-teal-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Short Break (5m)
          </button>
          <button
            onClick={() => changeMode('long_break')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mode === 'long_break'
                ? 'bg-sky-950 text-sky-300 border border-sky-800/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Long Break (15m)
          </button>
        </div>

        {/* Task Linkage Dropdown Selector */}
        <div className="max-w-md mx-auto mb-6 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-left">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <ListTodo size={12} className="text-teal-400" /> Link Open Task:
          </label>
          <select
            value={linkedTaskId || ''}
            onChange={(e) => updateLinkedTaskId(e.target.value || null)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded text-slate-200 outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="">-- No Linked Task --</option>
            {openTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Main Digital Clock Display & Progress Bar */}
        <div className="py-6 space-y-4">
          <div className="text-6xl sm:text-7xl font-black font-mono tracking-tight text-slate-100">
            {formattedTime}
          </div>

          <div className="max-w-md mx-auto space-y-1">
            <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-1000 ${
                  mode === 'work'
                    ? 'bg-purple-500'
                    : mode === 'short_break'
                    ? 'bg-teal-500'
                    : 'bg-sky-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>Progress: {progressPercentage}%</span>
              <span>{mode.replace('_', ' ').toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Controls Bar: Start, Pause, Resume, Reset, Skip */}
        <div className="flex items-center justify-center space-x-3 pt-4">
          {status === 'idle' && (
            <Button
              variant="purple"
              size="lg"
              icon={<Play size={18} />}
              onClick={startTimer}
              className="px-8 font-bold text-sm"
            >
              Start Focus
            </Button>
          )}

          {status === 'running' && (
            <Button
              variant="secondary"
              size="lg"
              icon={<Pause size={18} />}
              onClick={pauseTimer}
              className="px-8 font-bold text-sm"
            >
              Pause
            </Button>
          )}

          {status === 'paused' && (
            <Button
              variant="purple"
              size="lg"
              icon={<Play size={18} />}
              onClick={resumeTimer}
              className="px-8 font-bold text-sm"
            >
              Resume
            </Button>
          )}

          <Button
            variant="outline"
            size="md"
            icon={<RotateCcw size={15} />}
            onClick={resetTimer}
            title="Reset Session"
          >
            Reset
          </Button>

          <Button
            variant="ghost"
            size="md"
            icon={<SkipForward size={15} />}
            onClick={skipTimer}
            title="Skip Mode"
          >
            Skip
          </Button>
        </div>
      </Card>

      {/* Stats & Session History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today Focus Summary (1 Span) */}
        <Card padding="sm" title="Today's Focus Stats">
          <div className="space-y-4">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Completed Work Cycles</span>
              <div className="text-2xl font-black text-purple-300 font-mono flex items-center gap-2">
                <Flame size={20} className="text-amber-400" /> {todayWorkSessions.length} Cycles
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Focus Time</span>
              <div className="text-2xl font-black text-teal-300 font-mono flex items-center gap-2">
                <Clock size={20} className="text-teal-400" /> {todayTotalMinutes} Mins
              </div>
            </div>
          </div>
        </Card>

        {/* Session Log History (2 Spans) */}
        <div className="md:col-span-2">
          <Card title="Completed Session History">
            {sessions.length > 0 ? (
              <div className="divide-y divide-slate-800/80 max-h-[280px] overflow-y-auto">
                {sessions.slice(0, 10).map((s) => {
                  const linkedTaskObj = openTasks.find((t) => t.id === s.taskId);

                  return (
                    <div key={s.id} className="py-2.5 px-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 capitalize truncate">
                            {s.type.replace('_', ' ')} Session ({s.durationMinutes}m)
                          </p>
                          {linkedTaskObj && (
                            <p className="text-[10px] text-teal-400 truncate">
                              Linked: {linkedTaskObj.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<Timer size={24} />}
                title="No Sessions Completed"
                description="Start and complete a 25-minute focus session to begin logging history."
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PomodoroPage;