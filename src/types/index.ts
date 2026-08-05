export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string;     // YYYY-MM-DD
  dueTime?: string;     // HH:mm
  project: string;
  pomodoroEstimate: number;
  completedPomodoros?: number;
  category?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // ISO string or HH:mm
  endTime: string;    // ISO string or HH:mm
  category: string;
  location?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeBlock {
  id: string;
  date: string;       // YYYY-MM-DD
  title: string;
  startTime: string;  // HH:mm e.g. "08:30"
  endTime: string;    // HH:mm e.g. "09:30"
  category: string;
  taskId?: string;
  done: boolean;
  notes?: string;
}

export interface AgendaItem {
  id: string;
  itemType: 'event' | 'timeblock';
  title: string;
  description?: string;
  date: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  category: string;
  location?: string;
  done?: boolean;
  rawTimeMs: number;
  originalItem: CalendarEvent | TimeBlock;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string;
  date: string; // YYYY-MM-DD
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: number; // 1 - 12
  year: number;
}

export interface PomodoroSession {
  id: string;
  taskId?: string;
  durationMinutes: number;
  type: 'work' | 'short_break' | 'long_break';
  completedAt: string; // ISO string
}

export type AiContextMode = 'current' | 'today' | 'tasks' | 'finance' | 'notes' | 'full';

export interface AppSettings {
  userName: string;
  currency: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  temperature: number;
  contextWindow: number;
  contextMode: AiContextMode;
  theme: 'light' | 'dark' | 'system';
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isError?: boolean;
}