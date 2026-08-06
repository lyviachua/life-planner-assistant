import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/button';
import { saveTimeBlock, deleteTimeBlock, getTasks } from '@/services/dataService';
import { TimeBlock, Task } from '@/types';
import { Trash2 } from 'lucide-react';

export interface TimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockToEdit?: TimeBlock | null;
  defaultDateStr: string;
  defaultStartTime?: string;
  defaultTaskId?: string;
  defaultTitle?: string;
  onSuccess: () => void;
}

export const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  isOpen,
  onClose,
  blockToEdit = null,
  defaultDateStr,
  defaultStartTime = '09:00',
  defaultTaskId = '',
  defaultTitle = '',
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('Focus');
  const [taskId, setTaskId] = useState(defaultTaskId);
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    setAvailableTasks(getTasks().filter((t) => t.status !== 'completed'));
  }, [isOpen]);

  useEffect(() => {
    if (blockToEdit) {
      setTitle(blockToEdit.title || '');
      setDate(blockToEdit.date || defaultDateStr);
      setStartTime(blockToEdit.startTime || defaultStartTime);
      setEndTime(blockToEdit.endTime || '10:00');
      setCategory(blockToEdit.category || 'Focus');
      setTaskId(blockToEdit.taskId || '');
      setNotes(blockToEdit.notes || '');
      setDone(blockToEdit.done || false);
    } else {
      setTitle(defaultTitle || '');
      setDate(defaultDateStr);
      setStartTime(defaultStartTime);

      // Auto set end time to 1 hour after default start time
      const [h, m] = defaultStartTime.split(':').map(Number);
      const nextHour = String(Math.min(23, h + 1)).padStart(2, '0');
      setEndTime(`${nextHour}:${String(m).padStart(2, '0')}`);

      setCategory('Focus');
      setTaskId(defaultTaskId || '');
      setNotes('');
      setDone(false);
    }
    setTimeError(null);
  }, [blockToEdit, defaultDateStr, defaultStartTime, defaultTaskId, defaultTitle, isOpen]);

  useEffect(() => {
    if (startTime && endTime && endTime <= startTime) {
      setTimeError('End time must be after start time');
    } else {
      setTimeError(null);
    }
  }, [startTime, endTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;
    if (endTime <= startTime) {
      setTimeError('End time must be after start time');
      return;
    }

    saveTimeBlock({
      id: blockToEdit?.id,
      date,
      title,
      startTime,
      endTime,
      category,
      taskId: taskId || undefined,
      notes,
      done,
    });

    onSuccess();
    onClose();
  };

  const handleDelete = () => {
    if (blockToEdit && window.confirm(`Delete time block "${blockToEdit.title}"?`)) {
      deleteTimeBlock(blockToEdit.id);
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={blockToEdit ? 'Edit Time Block' : 'Schedule Time Block'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Title / Focus Focus" required>
          <input
            type="text"
            placeholder="e.g. Deep Work: System Architecture"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
          />
        </FormField>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <FormField label="Date" required>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>

          <FormField label="Start Time" required error={timeError || undefined}>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>

          <FormField label="End Time" required>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            >
              <option value="Focus">Focus</option>
              <option value="Work">Work</option>
              <option value="Meeting">Meeting</option>
              <option value="Routine">Routine</option>
              <option value="Health">Health</option>
              <option value="Personal">Personal</option>
            </select>
          </FormField>

          <FormField label="Linked Task (Optional)">
            <select
              value={taskId}
              onChange={(e) => {
                setTaskId(e.target.value);
                const matchedTask = availableTasks.find((t) => t.id === e.target.value);
                if (matchedTask && !title) {
                  setTitle(matchedTask.title);
                }
              }}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            >
              <option value="">-- Unlinked --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority})
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            rows={2}
            placeholder="Preparation steps or checklist notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none resize-none"
          />
        </FormField>

        {blockToEdit && (
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="block-done"
              checked={done}
              onChange={(e) => setDone(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-teal-500 focus:ring-teal-500"
            />
            <label htmlFor="block-done" className="text-xs text-slate-300 font-medium cursor-pointer">
              Mark time block as completed
            </label>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {blockToEdit ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!!timeError}>
              {blockToEdit ? 'Save Block' : 'Create Block'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};