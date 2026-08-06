import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { getTasks, saveTask, toggleTaskComplete, deleteTask, subscribeToDataChanges } from '@/services/dataService';
import { Task, TaskPriority } from '@/types';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  AlertTriangle,
  Folder,
  Timer,
} from 'lucide-react';

type FilterTab = 'open' | 'all' | 'completed' | 'overdue';
type SortOption = 'dueDate' | 'priority' | 'createdAt';

const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('open');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [project, setProject] = useState('General');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [pomodoroEstimate, setPomodoroEstimate] = useState(2);

  const refreshTasks = () => {
    setTasks(getTasks());
  };

  useEffect(() => {
    refreshTasks();
    const unsubscribe = subscribeToDataChanges(refreshTasks);
    return unsubscribe;
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering Logic
  const filteredTasks = tasks.filter((t) => {
    // Search query filter
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.project.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'open') return !t.completed;
    if (activeTab === 'completed') return t.completed;
    if (activeTab === 'overdue') return !t.completed && t.dueDate && t.dueDate < todayStr;
    return true; // 'all'
  });

  // Sorting Logic
  const priorityRank: Record<TaskPriority, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'priority') {
      return priorityRank[b.priority] - priorityRank[a.priority];
    }
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    // Default createdAt
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const openCreateModal = () => {
    setTaskToEdit(null);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setProject('General');
    setDueDate(todayStr);
    setDueTime('17:00');
    setPomodoroEstimate(2);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setProject(task.project || 'General');
    setDueDate(task.dueDate || todayStr);
    setDueTime(task.dueTime || '17:00');
    setPomodoroEstimate(task.pomodoroEstimate || 2);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    saveTask({
      id: taskToEdit?.id,
      title: title.trim(),
      description: description.trim(),
      priority,
      project: project.trim() || 'General',
      dueDate,
      dueTime,
      pomodoroEstimate: Number(pomodoroEstimate) || 2,
      completed: taskToEdit ? taskToEdit.completed : false,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    });

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(id);
    }
  };

  const getPriorityBadgeVariant = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return 'danger'; // Red
      case 'medium':
        return 'warning'; // Yellow
      case 'low':
        return 'teal'; // Blue/Teal
      default:
        return 'default';
    }
  };

  // Counts for tabs
  const openCount = tasks.filter((t) => !t.completed).length;
  const overdueCount = tasks.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Main Action */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CheckSquare className="text-teal-400" size={22} />
            To-Do List & Priority Execution
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize priority tasks, assign pomodoro estimates, and track deadline progress.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={openCreateModal}>
          + New Task
        </Button>
      </div>

      {/* Toolbar: Search, Filter Tabs & Sort Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-lg">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search tasks by title, description, or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1.5 pl-9 pr-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 border border-slate-800 rounded-lg p-1 bg-slate-950 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('open')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'open' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Open <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">{openCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'overdue' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overdue <span className="text-[10px] bg-rose-950 text-rose-300 px-1.5 py-0.2 rounded-full">{overdueCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full text-slate-300">{completedCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({tasks.length})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-400 font-mono">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority Level</option>
            <option value="createdAt">Creation Date</option>
          </select>
        </div>
      </div>

      {/* Task Item List */}
      <Card>
        {sortedTasks.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {sortedTasks.map((task) => {
              const isOverdue = !task.completed && task.dueDate && task.dueDate < todayStr;

              return (
                <div
                  key={task.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-slate-900/50 ${
                    task.completed ? 'opacity-55' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => toggleTaskComplete(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-teal-400 transition-colors shrink-0"
                      aria-label={`Mark task ${task.title} as ${task.completed ? 'pending' : 'completed'}`}
                    >
                      {task.completed ? (
                        <CheckCircle2 size={20} className="text-teal-400" />
                      ) : (
                        <Circle size={20} />
                      )}
                    </button>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-xs sm:text-sm font-bold text-slate-100 ${
                            task.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h3>

                        <StatusBadge
                          label={task.priority.toUpperCase()}
                          variant={getPriorityBadgeVariant(task.priority)}
                          size="sm"
                        />

                        {isOverdue && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 font-mono">
                            <AlertTriangle size={10} /> Overdue
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Folder size={11} className="text-teal-400" /> {task.project}
                        </span>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                            <Calendar size={11} /> Due: {task.dueDate} {task.dueTime ? `@ ${task.dueTime}` : ''}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-purple-300">
                          <Timer size={11} /> {task.pomodoroEstimate} Pomodoro(s)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-800 rounded-lg transition-colors"
                      aria-label="Edit task"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      aria-label="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<CheckSquare size={28} />}
            title="No Tasks Found"
            description="No matching action items under the active filter or search query."
            actionLabel="+ New Task"
            onAction={openCreateModal}
          />
        )}
      </Card>

      {/* Task Creation & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={taskToEdit ? 'Edit Action Task' : 'Create New Action Task'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Task Title" required>
            <input
              type="text"
              placeholder="e.g. Audit Q3 Expense Ledger Invoices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              rows={3}
              placeholder="Detailed task guidelines or completion criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none resize-none"
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FormField label="Priority Level">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="high">High (Red)</option>
                <option value="medium">Medium (Yellow)</option>
                <option value="low">Low (Blue)</option>
              </select>
            </FormField>

            <FormField label="Project / Category">
              <input
                type="text"
                placeholder="e.g. Finance"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>

            <FormField label="Pomodoro Estimate">
              <input
                type="number"
                min={1}
                max={20}
                value={pomodoroEstimate}
                onChange={(e) => setPomodoroEstimate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Due Date">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>

            <FormField label="Due Time">
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {taskToEdit ? 'Save Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TasksPage;