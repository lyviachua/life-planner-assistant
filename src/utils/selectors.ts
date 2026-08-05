import { CalendarEvent, Task, Transaction, Budget, PomodoroSession, TimeBlock, AgendaItem } from '@/types';

// Format currency with symbol fallback
export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    MYR: 'RM ',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
  };

  const prefix = symbols[currencyCode] || `${currencyCode} `;
  return `${prefix}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Merge Today's Calendar Events AND Day Planner Time Blocks in Chronological Order
export const getTodayMergedAgenda = (
  events: CalendarEvent[],
  timeBlocks: TimeBlock[],
  targetDateStr: string = new Date().toISOString().split('T')[0]
): AgendaItem[] => {
  const merged: AgendaItem[] = [];

  // 1. Process Calendar Events
  events.forEach((evt) => {
    let evtDateStr = evt.date;
    if (!evtDateStr && evt.startTime.includes('T')) {
      evtDateStr = new Date(evt.startTime).toISOString().split('T')[0];
    }

    if (evtDateStr === targetDateStr) {
      let sFormatted = evt.startTime;
      let eFormatted = evt.endTime;
      let ms = 0;

      try {
        if (evt.startTime.includes('T')) {
          const d = new Date(evt.startTime);
          ms = d.getTime();
          sFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          ms = new Date(`${targetDateStr}T${evt.startTime}:00`).getTime();
        }

        if (evt.endTime.includes('T')) {
          eFormatted = new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
      } catch {
        // Fallback
      }

      merged.push({
        id: evt.id,
        itemType: 'event',
        title: evt.title,
        description: evt.description || evt.notes,
        date: targetDateStr,
        startTimeFormatted: sFormatted,
        endTimeFormatted: eFormatted,
        category: evt.category,
        location: evt.location,
        rawTimeMs: ms,
        originalItem: evt,
      });
    }
  });

  // 2. Process Day Planner Time Blocks
  timeBlocks.forEach((tb) => {
    if (tb.date === targetDateStr) {
      let ms = 0;
      try {
        ms = new Date(`${targetDateStr}T${tb.startTime}:00`).getTime();
      } catch {
        ms = 0;
      }

      merged.push({
        id: tb.id,
        itemType: 'timeblock',
        title: tb.title,
        description: tb.notes,
        date: targetDateStr,
        startTimeFormatted: tb.startTime,
        endTimeFormatted: tb.endTime,
        category: tb.category,
        done: tb.done,
        rawTimeMs: ms,
        originalItem: tb,
      });
    }
  });

  // 3. Sort merged list chronologically
  return merged.sort((a, b) => a.rawTimeMs - b.rawTimeMs);
};

// Task metrics (open, overdue, sorted priority)
export const getTaskMetrics = (tasks: Task[]) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const openTasks = tasks.filter((t) => t.status !== 'completed');
  const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < todayStr);

  const priorityWeight: Record<Task['priority'], number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedPriorityTasks = [...openTasks].sort((a, b) => {
    const isAOverdue = a.dueDate && a.dueDate < todayStr ? 1 : 0;
    const isBOverdue = b.dueDate && b.dueDate < todayStr ? 1 : 0;

    if (isAOverdue !== isBOverdue) {
      return isBOverdue - isAOverdue;
    }

    const weightDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (weightDiff !== 0) return weightDiff;

    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  return {
    openCount: openTasks.length,
    overdueCount: overdueTasks.length,
    priorityTasks: sortedPriorityTasks,
  };
};

// Monthly Finance Metrics with Division-By-Zero Protection
export const getMonthlyFinanceMetrics = (
  transactions: Transaction[],
  budgets: Budget[],
  currentMonth: number = new Date().getMonth() + 1,
  currentYear: number = new Date().getFullYear()
) => {
  const monthTxs = transactions.filter((t) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthBudgets = budgets.filter((b) => b.month === currentMonth && b.year === currentYear);
  const totalBudgetLimit = monthBudgets.reduce((sum, b) => sum + (Number(b.monthlyLimit) || 0), 0);

  const categorySpent: Record<string, number> = {};
  monthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + (Number(t.amount) || 0);
    });

  const categoryBreakdown = monthBudgets.map((b) => {
    const spent = categorySpent[b.category] || 0;
    const limit = Number(b.monthlyLimit) || 0;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return {
      budgetId: b.id,
      category: b.category,
      limit,
      spent,
      percentage,
    };
  });

  // Safe percentage calculation preventing division by zero
  const budgetUtilizationPercentage =
    totalBudgetLimit > 0 ? Math.round((totalExpense / totalBudgetLimit) * 100) : 0;

  return {
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
    totalBudgetLimit,
    budgetUtilizationPercentage,
    categoryBreakdown,
  };
};

// Today Pomodoro Metrics
export const getTodayPomodoroMetrics = (sessions: PomodoroSession[], dailyTarget: number = 6) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todaySessions = sessions.filter((s) => {
    const sDate = new Date(s.completedAt).toISOString().split('T')[0];
    return sDate === todayStr && s.type === 'work';
  });

  const completedWorkSessions = todaySessions.length;
  const totalFocusMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  return {
    completedWorkSessions,
    totalFocusMinutes,
    dailyTarget,
    targetPercentage: Math.min(100, Math.round((completedWorkSessions / dailyTarget) * 100)),
  };
};