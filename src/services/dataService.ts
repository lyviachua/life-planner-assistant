import { CalendarEvent, Task, Transaction, Budget, PomodoroSession, Note, TimeBlock } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const KEYS = {
  EVENTS: 'lp_events_v1',
  TASKS: 'lp_tasks_v1',
  TRANSACTIONS: 'lp_transactions_v1',
  BUDGETS: 'lp_budgets_v1',
  POMODOROS: 'lp_pomodoros_v1',
  NOTES: 'lp_notes_v1',
  TIMEBLOCKS: 'lp_timeblocks_v1',
  INTENTIONS: 'lp_intentions_v1',
  ACTIVE_DATE: 'lp_active_date_v1',
};

// PubSub Subscriber Bus
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribeToDataChanges = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyDataChanged = () => {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Error in listener callback:', e);
    }
  });
};

const getItem = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed saving to storage:', err);
  }
};

const getUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id || null;
};

// Active Date State Sync
export const getActiveDate = (): string => {
  return getItem<string>(KEYS.ACTIVE_DATE, new Date().toISOString().split('T')[0]);
};

export const setActiveDate = (dateStr: string): void => {
  setItem(KEYS.ACTIVE_DATE, dateStr);
  notifyDataChanged();
};

export const resetActiveDateToToday = (): string => {
  const todayStr = new Date().toISOString().split('T')[0];
  setActiveDate(todayStr);
  return todayStr;
};

// Events API
export const getEvents = (): CalendarEvent[] => getItem<CalendarEvent[]>(KEYS.EVENTS, []);

export const saveEvent = (
  event: Partial<CalendarEvent> & { title: string; startTime: string; endTime: string; category: string }
): CalendarEvent => {
  const events = getEvents();
  const id = event.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowISO = new Date().toISOString();

  let dateStr = event.date;
  if (!dateStr) {
    try {
      dateStr = new Date(event.startTime).toISOString().split('T')[0];
    } catch {
      dateStr = nowISO.split('T')[0];
    }
  }

  const newEvt: CalendarEvent = {
    id,
    title: event.title,
    description: event.description || event.notes || '',
    date: dateStr,
    startTime: event.startTime,
    endTime: event.endTime,
    category: event.category || 'General',
    location: event.location || '',
    notes: event.notes || event.description || '',
    createdAt: event.createdAt || nowISO,
    updatedAt: nowISO,
  };

  const updated = [newEvt, ...events.filter((e) => e.id !== id)];
  setItem(KEYS.EVENTS, updated);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('events').upsert({
        id: id.startsWith('evt_') ? undefined : id,
        user_id: userId,
        title: newEvt.title,
        description: newEvt.description,
        date: newEvt.date,
        start_time: newEvt.startTime,
        end_time: newEvt.endTime,
        category: newEvt.category,
        location: newEvt.location,
        notes: newEvt.notes,
      });
    }
  });

  notifyDataChanged();
  return newEvt;
};

export const deleteEvent = (id: string): boolean => {
  const events = getEvents();
  setItem(KEYS.EVENTS, events.filter((e) => e.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('evt_')) {
      supabase.from('events').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

// Time Blocks API
export const getTimeBlocks = (): TimeBlock[] => getItem<TimeBlock[]>(KEYS.TIMEBLOCKS, []);

export const getTimeBlocksForDate = (dateStr: string): TimeBlock[] => {
  return getTimeBlocks()
    .filter((tb) => tb.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const saveTimeBlock = (tb: Omit<TimeBlock, 'id'> & { id?: string }): TimeBlock => {
  const all = getTimeBlocks();
  const id = tb.id || `tb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newTb: TimeBlock = {
    id,
    date: tb.date,
    title: tb.title,
    startTime: tb.startTime,
    endTime: tb.endTime,
    category: tb.category || 'Focus',
    taskId: tb.taskId,
    done: tb.done ?? false,
    notes: tb.notes || '',
  };
  const updated = [newTb, ...all.filter((x) => x.id !== id)];
  setItem(KEYS.TIMEBLOCKS, updated);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('time_blocks').upsert({
        id: id.startsWith('tb_') ? undefined : id,
        user_id: userId,
        task_id: newTb.taskId || null,
        date: newTb.date,
        title: newTb.title,
        start_time: newTb.startTime,
        end_time: newTb.endTime,
        category: newTb.category,
        done: newTb.done,
        notes: newTb.notes,
      });
    }
  });

  notifyDataChanged();
  return newTb;
};

export const toggleTimeBlockDone = (id: string): TimeBlock | null => {
  const all = getTimeBlocks();
  const target = all.find((x) => x.id === id);
  if (!target) return null;
  const updated = { ...target, done: !target.done };
  saveTimeBlock(updated);
  return updated;
};

export const deleteTimeBlock = (id: string): boolean => {
  const all = getTimeBlocks();
  setItem(KEYS.TIMEBLOCKS, all.filter((x) => x.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('tb_')) {
      supabase.from('time_blocks').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

export const copyTimeBlocksToDate = (sourceDate: string, targetDate: string): number => {
  const sourceBlocks = getTimeBlocksForDate(sourceDate);
  if (sourceBlocks.length === 0) return 0;

  sourceBlocks.forEach((sb) => {
    saveTimeBlock({
      ...sb,
      id: undefined,
      date: targetDate,
      done: false,
    });
  });

  return sourceBlocks.length;
};

// Daily Intentions API
export const getDailyIntention = (dateStr: string): string => {
  const intentions = getItem<Record<string, string>>(KEYS.INTENTIONS, {});
  return intentions[dateStr] || '';
};

export const saveDailyIntention = (dateStr: string, text: string): void => {
  const intentions = getItem<Record<string, string>>(KEYS.INTENTIONS, {});
  intentions[dateStr] = text;
  setItem(KEYS.INTENTIONS, intentions);
  notifyDataChanged();
};

// Tasks API
export const getTasks = (): Task[] => getItem<Task[]>(KEYS.TASKS, []);

export const saveTask = (task: Partial<Task> & { title: string }): Task => {
  const tasks = getTasks();
  const id = task.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = task.createdAt || new Date().toISOString();
  const completed = task.completed ?? (task.status === 'completed');

  const newTask: Task = {
    id,
    title: task.title,
    description: task.description || '',
    completed,
    status: completed ? 'completed' : 'pending',
    priority: task.priority || 'medium',
    dueDate: task.dueDate || '',
    dueTime: task.dueTime || '17:00',
    project: task.project || task.category || 'General',
    pomodoroEstimate: task.pomodoroEstimate ?? 2,
    completedPomodoros: task.completedPomodoros ?? 0,
    category: task.category || task.project || 'General',
    createdAt,
  };

  const updated = [newTask, ...tasks.filter((t) => t.id !== id)];
  setItem(KEYS.TASKS, updated);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('tasks').upsert({
        id: id.startsWith('tsk_') ? undefined : id,
        user_id: userId,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        completed: newTask.completed,
        priority: newTask.priority,
        due_date: newTask.dueDate,
        due_time: newTask.dueTime,
        project: newTask.project,
        pomodoro_estimate: newTask.pomodoroEstimate,
        completed_pomodoros: newTask.completedPomodoros,
        category: newTask.category,
      });
    }
  });

  notifyDataChanged();
  return newTask;
};

export const toggleTaskComplete = (id: string): Task | null => {
  const tasks = getTasks();
  const target = tasks.find((t) => t.id === id);
  if (!target) return null;

  const newCompleted = !target.completed;
  const updatedTask: Task = {
    ...target,
    completed: newCompleted,
    status: newCompleted ? 'completed' : 'pending',
  };

  return saveTask(updatedTask);
};

export const deleteTask = (id: string): boolean => {
  const tasks = getTasks();
  setItem(KEYS.TASKS, tasks.filter((t) => t.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('tsk_')) {
      supabase.from('tasks').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

// Notes API
export const getNotes = (): Note[] => getItem<Note[]>(KEYS.NOTES, []);

export const saveNote = (note: Partial<Note> & { title: string; body: string }): Note => {
  const notes = getNotes();
  const id = note.id || `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const nowISO = new Date().toISOString();

  const newNote: Note = {
    id,
    title: note.title,
    body: note.body,
    tags: note.tags || [],
    pinned: note.pinned ?? false,
    createdAt: note.createdAt || nowISO,
    updatedAt: nowISO,
  };

  const updated = [newNote, ...notes.filter((n) => n.id !== id)];
  setItem(KEYS.NOTES, updated);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('notes').upsert({
        id: id.startsWith('note_') ? undefined : id,
        user_id: userId,
        title: newNote.title,
        body: newNote.body,
        tags: newNote.tags,
        pinned: newNote.pinned,
      });
    }
  });

  notifyDataChanged();
  return newNote;
};

export const togglePinNote = (id: string): Note | null => {
  const notes = getNotes();
  const target = notes.find((n) => n.id === id);
  if (!target) return null;

  const updatedNote = { ...target, pinned: !target.pinned, updatedAt: new Date().toISOString() };
  return saveNote(updatedNote);
};

export const deleteNote = (id: string): boolean => {
  const notes = getNotes();
  setItem(KEYS.NOTES, notes.filter((n) => n.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('note_')) {
      supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

// Transactions API
export const getTransactions = (): Transaction[] => getItem<Transaction[]>(KEYS.TRANSACTIONS, []);

export const saveTransaction = (tx: Omit<Transaction, 'id'> & { id?: string }): Transaction => {
  const txs = getTransactions();
  const id = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newTx: Transaction = {
    ...tx,
    id,
    paymentMethod: tx.paymentMethod || 'Credit Card',
  };
  setItem(KEYS.TRANSACTIONS, [newTx, ...txs.filter((t) => t.id !== id)]);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('transactions').upsert({
        id: id.startsWith('tx_') ? undefined : id,
        user_id: userId,
        type: newTx.type,
        amount: newTx.amount,
        category: newTx.category,
        description: newTx.description,
        payment_method: newTx.paymentMethod,
        date: newTx.date,
      });
    }
  });

  notifyDataChanged();
  return newTx;
};

export const deleteTransaction = (id: string): boolean => {
  const txs = getTransactions();
  setItem(KEYS.TRANSACTIONS, txs.filter((t) => t.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('tx_')) {
      supabase.from('transactions').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

// Budgets API
export const getBudgets = (): Budget[] => getItem<Budget[]>(KEYS.BUDGETS, []);

export const saveBudget = (b: Omit<Budget, 'id'> & { id?: string }): Budget => {
  const budgets = getBudgets();
  const id = b.id || `bgt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newB: Budget = { ...b, id };
  setItem(KEYS.BUDGETS, [newB, ...budgets.filter((x) => x.id !== id)]);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('budgets').upsert({
        id: id.startsWith('bgt_') ? undefined : id,
        user_id: userId,
        category: newB.category,
        monthly_limit: newB.monthlyLimit,
        month: newB.month,
        year: newB.year,
      });
    }
  });

  notifyDataChanged();
  return newB;
};

export const deleteBudget = (id: string): boolean => {
  const budgets = getBudgets();
  setItem(KEYS.BUDGETS, budgets.filter((b) => b.id !== id));

  getUserId().then((userId) => {
    if (userId && !id.startsWith('bgt_')) {
      supabase.from('budgets').delete().eq('id', id).eq('user_id', userId);
    }
  });

  notifyDataChanged();
  return true;
};

// Pomodoro API
export const getPomodoroSessions = (): PomodoroSession[] => getItem<PomodoroSession[]>(KEYS.POMODOROS, []);

export const addPomodoroSession = (session: Omit<PomodoroSession, 'id' | 'completedAt'>): PomodoroSession => {
  const sessions = getPomodoroSessions();
  const newS: PomodoroSession = {
    ...session,
    id: `pomo_${Date.now()}`,
    completedAt: new Date().toISOString(),
  };
  setItem(KEYS.POMODOROS, [newS, ...sessions]);

  getUserId().then((userId) => {
    if (userId) {
      supabase.from('pomodoro_sessions').insert({
        user_id: userId,
        task_id: newS.taskId || null,
        duration_minutes: newS.durationMinutes,
        type: newS.type,
      });
    }
  });

  notifyDataChanged();
  return newS;
};

export const loadSampleData = () => {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sampleEvents: CalendarEvent[] = [
    {
      id: 'sample_evt_1',
      title: 'Morning Executive Sync',
      description: 'Quarterly OKR review and roadmap alignment',
      date: todayStr,
      startTime: `${todayStr}T09:00:00`,
      endTime: `${todayStr}T10:00:00`,
      category: 'Work',
      location: 'Conference Room A',
      notes: 'Prepare Q3 performance metrics deck',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  setItem(KEYS.EVENTS, sampleEvents);
  notifyDataChanged();
};

export const clearAllData = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  notifyDataChanged();
};