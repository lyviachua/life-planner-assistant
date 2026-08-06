import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/button';
import {
  saveEvent,
  saveTask,
  saveTimeBlock,
  saveTransaction,
  saveNote,
} from '@/services/dataService';
import { TaskPriority } from '@/types';
import { Calendar, CheckSquare, Clock, Wallet, FileText } from 'lucide-react';

export interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'task' | 'event' | 'timeblock' | 'expense' | 'note';
  onSuccess?: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'task',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'event' | 'timeblock' | 'expense' | 'note'>(defaultTab);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskProject, setTaskProject] = useState('General');

  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Work');
  const [eventStartTime, setEventStartTime] = useState('');

  const [tbTitle, setTbTitle] = useState('');
  const [tbCategory, setTbCategory] = useState('Focus');
  const [tbStartTime, setTbStartTime] = useState('09:00');
  const [tbEndTime, setTbEndTime] = useState('10:00');

  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txDescription, setTxDescription] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    saveTask({
      title: taskTitle.trim(),
      priority: taskPriority,
      project: taskProject.trim() || 'General',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '17:00',
      pomodoroEstimate: 2,
      completed: false,
    });

    setTaskTitle('');
    onSuccess?.();
    onClose();
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const startTimeISO = eventStartTime
      ? new Date(eventStartTime).toISOString()
      : new Date().toISOString();

    const endTimeISO = new Date(new Date(startTimeISO).getTime() + 3600000).toISOString();

    saveEvent({
      title: eventTitle.trim(),
      category: eventCategory,
      startTime: startTimeISO,
      endTime: endTimeISO,
      date: startTimeISO.split('T')[0],
    });

    setEventTitle('');
    onSuccess?.();
    onClose();
  };

  const handleCreateTimeBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tbTitle.trim()) return;

    saveTimeBlock({
      date: new Date().toISOString().split('T')[0],
      title: tbTitle.trim(),
      startTime: tbStartTime,
      endTime: tbEndTime,
      category: tbCategory,
      done: false,
    });

    setTbTitle('');
    onSuccess?.();
    onClose();
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || isNaN(Number(txAmount))) return;

    saveTransaction({
      type: txType,
      amount: parseFloat(txAmount),
      category: txCategory,
      description: txDescription || `${txType === 'expense' ? 'Expense' : 'Income'} entry`,
      date: new Date().toISOString().split('T')[0],
    });

    setTxAmount('');
    setTxDescription('');
    onSuccess?.();
    onClose();
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    saveNote({
      title: noteTitle.trim(),
      body: noteBody,
      tags: ['QuickNote'],
      pinned: false,
    });

    setNoteTitle('');
    setNoteBody('');
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Quick Creation Drawer">
      {/* Choice Tabs */}
      <div className="flex border-b border-slate-800 mb-5 overflow-x-auto text-[11px]">
        <button
          onClick={() => setActiveTab('task')}
          className={`py-2 px-3 font-bold border-b-2 flex items-center gap-1 transition-colors whitespace-nowrap ${
            activeTab === 'task'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CheckSquare size={13} /> Task
        </button>
        <button
          onClick={() => setActiveTab('event')}
          className={`py-2 px-3 font-bold border-b-2 flex items-center gap-1 transition-colors whitespace-nowrap ${
            activeTab === 'event'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar size={13} /> Event
        </button>
        <button
          onClick={() => setActiveTab('timeblock')}
          className={`py-2 px-3 font-bold border-b-2 flex items-center gap-1 transition-colors whitespace-nowrap ${
            activeTab === 'timeblock'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock size={13} /> Time Block
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`py-2 px-3 font-bold border-b-2 flex items-center gap-1 transition-colors whitespace-nowrap ${
            activeTab === 'expense'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet size={13} /> Expense
        </button>
        <button
          onClick={() => setActiveTab('note')}
          className={`py-2 px-3 font-bold border-b-2 flex items-center gap-1 transition-colors whitespace-nowrap ${
            activeTab === 'note'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={13} /> Note
        </button>
      </div>

      {activeTab === 'task' && (
        <form onSubmit={handleCreateTask} className="space-y-4">
          <FormField label="Task Title" required>
            <input
              type="text"
              placeholder="e.g. Audit Q3 Expense Ledger Invoices"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Priority">
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
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
                value={taskProject}
                onChange={(e) => setTaskProject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Create Task
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'event' && (
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <FormField label="Event Title" required>
            <input
              type="text"
              placeholder="e.g. Executive Strategy Alignment"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Category">
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="Work">Work</option>
                <option value="Focus">Focus</option>
                <option value="Meeting">Meeting</option>
                <option value="Personal">Personal</option>
              </select>
            </FormField>

            <FormField label="Start Date/Time">
              <input
                type="datetime-local"
                value={eventStartTime}
                onChange={(e) => setEventStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Event
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'timeblock' && (
        <form onSubmit={handleCreateTimeBlock} className="space-y-4">
          <FormField label="Focus Focus Title" required>
            <input
              type="text"
              placeholder="e.g. Deep Sprint: System Architecture"
              value={tbTitle}
              onChange={(e) => setTbTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </FormField>

          <div className="grid grid-cols-3 gap-2">
            <FormField label="Category">
              <select
                value={tbCategory}
                onChange={(e) => setTbCategory(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="Focus">Focus</option>
                <option value="Work">Work</option>
                <option value="Meeting">Meeting</option>
                <option value="Routine">Routine</option>
              </select>
            </FormField>

            <FormField label="Start Time">
              <input
                type="time"
                value={tbStartTime}
                onChange={(e) => setTbStartTime(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>

            <FormField label="End Time">
              <input
                type="time"
                value={tbEndTime}
                onChange={(e) => setTbEndTime(e.target.value)}
                className="w-full px-2 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              />
            </FormField>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Time Block
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'expense' && (
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </FormField>

            <FormField label="Amount" required>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={txAmount}
                onChange={(e) => setTxAmount(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </FormField>
          </div>

          <FormField label="Category">
            <select
              value={txCategory}
              onChange={(e) => setTxCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            >
              <option value="Food & Dining">Food & Dining</option>
              <option value="Housing & Utilities">Housing & Utilities</option>
              <option value="Transport">Transport</option>
              <option value="Salary">Salary</option>
              <option value="General">General</option>
            </select>
          </FormField>

          <FormField label="Description">
            <input
              type="text"
              placeholder="e.g. Monthly Grocery Supplies"
              value={txDescription}
              onChange={(e) => setTxDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Log Expense
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'note' && (
        <form onSubmit={handleCreateNote} className="space-y-4">
          <FormField label="Note Title" required>
            <input
              type="text"
              placeholder="e.g. Quick Strategic Insights"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
            />
          </FormField>

          <FormField label="Content / Markdown">
            <textarea
              rows={4}
              placeholder="Write thoughts or scratchpad notes..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none resize-none font-mono"
            />
          </FormField>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Note
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};