import { AiContextMode } from '@/types';
import {
  getEvents,
  getTimeBlocks,
  getTasks,
  getTransactions,
  getBudgets,
  getNotes,
  getPomodoroSessions,
  getActiveDate,
  getDailyIntention,
} from './dataService';
import { getAppSettings } from './storageService';
import { formatCurrency, getMonthlyFinanceMetrics, getTodayMergedAgenda } from '@/utils/selectors';

export const buildAiContext = (mode: AiContextMode, pathname: string = window.location.pathname): string => {
  const settings = getAppSettings();
  const activeDate = getActiveDate();
  const intention = getDailyIntention(activeDate);

  const lines: string[] = [
    '=== BEGIN USER PLANNER REFERENCE DATA ===',
    `User Name: ${settings.userName}`,
    `Active Date: ${activeDate}`,
    `Current Page Route: ${pathname}`,
  ];

  if (intention) {
    lines.push(`Daily Intention: "${intention}"`);
  }

  const includeToday = mode === 'today' || mode === 'full' || (mode === 'current' && (pathname === '/' || pathname === '/day-planner' || pathname === '/calendar'));
  const includeTasks = mode === 'tasks' || mode === 'full' || (mode === 'current' && pathname === '/tasks');
  const includeFinance = mode === 'finance' || mode === 'full' || (mode === 'current' && pathname === '/expenses');
  const includeNotes = mode === 'notes' || mode === 'full' || (mode === 'current' && pathname === '/notes');

  // Today Agenda & Focus Summary
  if (includeToday) {
    const events = getEvents();
    const timeBlocks = getTimeBlocks();
    const agenda = getTodayMergedAgenda(events, timeBlocks, activeDate);
    const pomodoros = getPomodoroSessions();

    lines.push('\n--- TODAY SCHEDULE & AGENDA ---');
    if (agenda.length === 0) {
      lines.push('No schedule items recorded for today.');
    } else {
      agenda.forEach((item) => {
        lines.push(`- [${item.itemType.toUpperCase()}] ${item.startTimeFormatted} - ${item.endTimeFormatted}: ${item.title} (${item.category})${item.done ? ' [COMPLETED]' : ''}`);
      });
    }

    const todayWorkSessions = pomodoros.filter(s => new Date(s.completedAt).toISOString().split('T')[0] === activeDate && s.type === 'work');
    lines.push(`Focus Sessions Today: ${todayWorkSessions.length} completed.`);
  }

  // Tasks Section
  if (includeTasks || includeToday) {
    const tasks = getTasks();
    const openTasks = tasks.filter((t) => !t.completed);
    
    lines.push('\n--- ACTION TASKS ---');
    lines.push(`Open Tasks Count: ${openTasks.length}`);
    openTasks.slice(0, 10).forEach((t) => {
      lines.push(`- [${t.priority.toUpperCase()}] "${t.title}" | Project: ${t.project} | Due: ${t.dueDate || 'No Date'}`);
    });
  }

  // Finance Section
  if (includeFinance) {
    const txs = getTransactions();
    const budgets = getBudgets();
    const metrics = getMonthlyFinanceMetrics(txs, budgets);

    lines.push('\n--- MONTHLY FINANCE OVERVIEW ---');
    lines.push(`Income: ${formatCurrency(metrics.totalIncome, settings.currency)}`);
    lines.push(`Expenses: ${formatCurrency(metrics.totalExpense, settings.currency)}`);
    lines.push(`Net Balance: ${formatCurrency(metrics.netBalance, settings.currency)}`);
    lines.push(`Budget Utilization: ${metrics.budgetUtilizationPercentage}%`);
    
    if (metrics.categoryBreakdown.length > 0) {
      lines.push('Category Spending:');
      metrics.categoryBreakdown.forEach((cb) => {
        lines.push(`  * ${cb.category}: Spent ${formatCurrency(cb.spent, settings.currency)} / Limit ${formatCurrency(cb.limit, settings.currency)} (${cb.percentage}%)`);
      });
    }
  }

  // Notes Section: Note bodies are ONLY included if mode === 'notes' or mode === 'full'
  if (includeNotes) {
    const notes = getNotes();
    lines.push('\n--- PERSONAL NOTES & MEMOS ---');
    if (notes.length === 0) {
      lines.push('No notes recorded.');
    } else {
      notes.slice(0, 5).forEach((n) => {
        lines.push(`- NOTE TITLE: "${n.title}" (Tags: ${n.tags.join(', ') || 'None'})`);
        if (mode === 'notes' || mode === 'full') {
          lines.push(`  BODY: ${n.body.substring(0, 300)}${n.body.length > 300 ? '...' : ''}`);
        } else {
          lines.push('  [Body omitted for privacy - select "Notes" context mode to include note content]');
        }
      });
    }
  } else {
    lines.push('\n[Note: Personal Markdown note bodies excluded for privacy unless Notes/Full mode is selected]');
  }

  lines.push('=== END USER PLANNER REFERENCE DATA ===');
  return lines.join('\n');
};