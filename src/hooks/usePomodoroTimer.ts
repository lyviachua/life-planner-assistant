import { useState, useEffect, useRef, useCallback } from 'react';
import {
  addPomodoroSession,
  getTasks,
  saveTask,
  subscribeToDataChanges,
} from '@/services/dataService';
import { Task } from '@/types';

export type TimerMode = 'work' | 'short_break' | 'long_break';
export type TimerStatus = 'idle' | 'running' | 'paused';

const DEFAULT_DURATIONS: Record<TimerMode, number> = {
  work: 25 * 60,       // 25 minutes
  short_break: 5 * 60, // 5 minutes
  long_break: 15 * 60, // 15 minutes
};

const TIMER_STORAGE_KEY = 'lp_pomo_timer_state_v1';

interface StoredTimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  startedAt: number | null;
  expectedEndAt: number | null;
  cycleCount: number; // Completed work sessions in current set (0-4)
  linkedTaskId: string | null;
}

// Browser Web Audio API Chime Synthesizer (No external packages required)
const playCompletionChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(523.25, 0, 0.4);   // C5
    playNote(659.25, 0.2, 0.4); // E5
    playNote(783.99, 0.4, 0.6); // G5
  } catch {
    // Ignore audio context autoplay blocks
  }
};

export const usePomodoroTimer = () => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(DEFAULT_DURATIONS.work);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);

  const expectedEndAtRef = useRef<number | null>(null);

  // Restore State on Initial Load / Refresh
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (raw) {
        const stored: StoredTimerState = JSON.parse(raw);
        setMode(stored.mode || 'work');
        setCycleCount(stored.cycleCount || 0);
        setLinkedTaskId(stored.linkedTaskId || null);

        if (stored.status === 'running' && stored.expectedEndAt) {
          const diffSeconds = Math.ceil((stored.expectedEndAt - Date.now()) / 1000);
          if (diffSeconds > 0) {
            setStatus('running');
            setRemainingSeconds(diffSeconds);
            expectedEndAtRef.current = stored.expectedEndAt;
          } else {
            // Completed while user was away!
            setStatus('idle');
            setRemainingSeconds(DEFAULT_DURATIONS[stored.mode || 'work']);
            expectedEndAtRef.current = null;
          }
        } else if (stored.status === 'paused') {
          setStatus('paused');
          setRemainingSeconds(stored.remainingSeconds || DEFAULT_DURATIONS[stored.mode || 'work']);
        } else {
          setStatus('idle');
          setRemainingSeconds(stored.remainingSeconds || DEFAULT_DURATIONS[stored.mode || 'work']);
        }
      }
    } catch {
      // Fallback
    }
  }, []);

  // Sync Timer State to localStorage
  const persistState = useCallback(
    (
      newMode: TimerMode,
      newStatus: TimerStatus,
      newRemaining: number,
      endAt: number | null,
      cycles: number,
      taskId: string | null
    ) => {
      try {
        const stateToSave: StoredTimerState = {
          mode: newMode,
          status: newStatus,
          remainingSeconds: newRemaining,
          startedAt: newStatus === 'running' ? Date.now() : null,
          expectedEndAt: endAt,
          cycleCount: cycles,
          linkedTaskId: taskId,
        };
        localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (err) {
        console.error('Failed to persist pomodoro state:', err);
      }
    },
    []
  );

  // Complete Session Handler
  const handleSessionCompleted = useCallback(
    (currentMode: TimerMode, currentTaskId: string | null, currentCycles: number) => {
      playCompletionChime();

      const durationMins = Math.round(DEFAULT_DURATIONS[currentMode] / 60);

      // 1. Record completed session
      addPomodoroSession({
        taskId: currentTaskId || undefined,
        durationMinutes: durationMins,
        type: currentMode,
      });

      // 2. Increment completed pomodoros count on linked task
      if (currentTaskId && currentMode === 'work') {
        const tasks = getTasks();
        const linkedTask = tasks.find((t) => t.id === currentTaskId);
        if (linkedTask) {
          saveTask({
            ...linkedTask,
            completedPomodoros: (linkedTask.completedPomodoros || 0) + 1,
          });
        }
      }

      // 3. Determine Next Mode & Cycle Count
      let nextMode: TimerMode = 'work';
      let nextCycles = currentCycles;

      if (currentMode === 'work') {
        nextCycles = currentCycles + 1;
        if (nextCycles >= 4) {
          nextMode = 'long_break';
          nextCycles = 0; // Reset after long break trigger
        } else {
          nextMode = 'short_break';
        }
      } else {
        nextMode = 'work';
      }

      const nextDuration = DEFAULT_DURATIONS[nextMode];
      setMode(nextMode);
      setStatus('idle');
      setRemainingSeconds(nextDuration);
      setCycleCount(nextCycles);
      expectedEndAtRef.current = null;

      persistState(nextMode, 'idle', nextDuration, null, nextCycles, currentTaskId);
    },
    [persistState]
  );

  // Interval Tick Mechanism
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (status === 'running') {
      interval = setInterval(() => {
        if (!expectedEndAtRef.current) return;

        const diff = Math.ceil((expectedEndAtRef.current - Date.now()) / 1000);

        if (diff <= 0) {
          if (interval) clearInterval(interval);
          handleSessionCompleted(mode, linkedTaskId, cycleCount);
        } else {
          setRemainingSeconds(diff);
          persistState(mode, 'running', diff, expectedEndAtRef.current, cycleCount, linkedTaskId);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, mode, cycleCount, linkedTaskId, handleSessionCompleted, persistState]);

  // Actions
  const startTimer = () => {
    const endAt = Date.now() + remainingSeconds * 1000;
    expectedEndAtRef.current = endAt;
    setStatus('running');
    persistState(mode, 'running', remainingSeconds, endAt, cycleCount, linkedTaskId);
  };

  const pauseTimer = () => {
    setStatus('paused');
    expectedEndAtRef.current = null;
    persistState(mode, 'paused', remainingSeconds, null, cycleCount, linkedTaskId);
  };

  const resumeTimer = () => {
    startTimer();
  };

  const resetTimer = () => {
    const defaultSecs = DEFAULT_DURATIONS[mode];
    setStatus('idle');
    setRemainingSeconds(defaultSecs);
    expectedEndAtRef.current = null;
    persistState(mode, 'idle', defaultSecs, null, cycleCount, linkedTaskId);
  };

  const skipTimer = () => {
    let nextMode: TimerMode = 'work';
    if (mode === 'work') {
      nextMode = cycleCount + 1 >= 4 ? 'long_break' : 'short_break';
    }
    const defaultSecs = DEFAULT_DURATIONS[nextMode];
    setMode(nextMode);
    setStatus('idle');
    setRemainingSeconds(defaultSecs);
    expectedEndAtRef.current = null;
    persistState(nextMode, 'idle', defaultSecs, null, cycleCount, linkedTaskId);
  };

  const changeMode = (newMode: TimerMode) => {
    const defaultSecs = DEFAULT_DURATIONS[newMode];
    setMode(newMode);
    setStatus('idle');
    setRemainingSeconds(defaultSecs);
    expectedEndAtRef.current = null;
    persistState(newMode, 'idle', defaultSecs, null, cycleCount, linkedTaskId);
  };

  const updateLinkedTaskId = (id: string | null) => {
    setLinkedTaskId(id);
    persistState(mode, status, remainingSeconds, expectedEndAtRef.current, cycleCount, id);
  };

  const totalDuration = DEFAULT_DURATIONS[mode];
  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round(((totalDuration - remainingSeconds) / totalDuration) * 100))
  );

  return {
    mode,
    status,
    remainingSeconds,
    cycleCount,
    linkedTaskId,
    totalDuration,
    progressPercentage,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipTimer,
    changeMode,
    updateLinkedTaskId,
  };
};