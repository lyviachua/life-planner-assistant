import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Button } from '@/components/ui/button';
import { saveEvent, deleteEvent } from '@/services/dataService';
import { CalendarEvent } from '@/types';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  defaultDateStr?: string;
  existingEvents: CalendarEvent[];
  onSuccess: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit = null,
  defaultDateStr,
  existingEvents,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState('Work');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [timeError, setTimeError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title || '');
      setDate(eventToEdit.date || new Date().toISOString().split('T')[0]);

      // Extract time string HH:mm from ISO or raw string
      let sTime = '09:00';
      let eTime = '10:00';
      try {
        if (eventToEdit.startTime.includes('T')) {
          sTime = new Date(eventToEdit.startTime).toTimeString().substring(0, 5);
        } else {
          sTime = eventToEdit.startTime;
        }
        if (eventToEdit.endTime.includes('T')) {
          eTime = new Date(eventToEdit.endTime).toTimeString().substring(0, 5);
        } else {
          eTime = eventToEdit.endTime;
        }
      } catch {
        // Fallback
      }

      setStartTime(sTime);
      setEndTime(eTime);
      setCategory(eventToEdit.category || 'Work');
      setLocation(eventToEdit.location || '');
      setNotes(eventToEdit.notes || eventToEdit.description || '');
    } else {
      const initialDate = defaultDateStr || new Date().toISOString().split('T')[0];
      setTitle('');
      setDate(initialDate);
      setStartTime('09:00');
      setEndTime('10:00');
      setCategory('Work');
      setLocation('');
      setNotes('');
    }
    setTimeError(null);
    setConflictWarning(null);
  }, [eventToEdit, defaultDateStr, isOpen]);

  // Real-time validation & conflict checking
  useEffect(() => {
    if (!startTime || !endTime) return;

    if (endTime <= startTime) {
      setTimeError('End time must be later than start time.');
      setConflictWarning(null);
      return;
    } else {
      setTimeError(null);
    }

    // Check time conflict with existing events on same date
    if (date) {
      const sameDayEvents = existingEvents.filter(
        (e) => e.date === date && e.id !== eventToEdit?.id
      );

      const conflict = sameDayEvents.find((e) => {
        let eStart = '00:00';
        let eEnd = '23:59';
        try {
          eStart = e.startTime.includes('T') ? new Date(e.startTime).toTimeString().substring(0, 5) : e.startTime;
          eEnd = e.endTime.includes('T') ? new Date(e.endTime).toTimeString().substring(0, 5) : e.endTime;
        } catch {
          // Ignore
        }
        return startTime < eEnd && endTime > eStart;
      });

      if (conflict) {
        setConflictWarning(
          `Overlaps with "${conflict.title}" (${conflict.startTime.includes('T') ? new Date(conflict.startTime).toTimeString().substring(0, 5) : conflict.startTime} - ${conflict.endTime.includes('T') ? new Date(conflict.endTime).toTimeString().substring(0, 5) : conflict.endTime}). You can still save if intentional.`
        );
      } else {
        setConflictWarning(null);
      }
    }
  }, [startTime, endTime, date, existingEvents, eventToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    if (endTime <= startTime) {
      setTimeError('End time must be later than start time.');
      return;
    }

    // Build ISO timestamp strings
    const startIso = new Date(`${date}T${startTime}:00`).toISOString();
    const endIso = new Date(`${date}T${endTime}:00`).toISOString();

    saveEvent({
      id: eventToEdit?.id,
      title,
      date,
      startTime: startIso,
      endTime: endIso,
      category,
      location,
      notes,
      description: notes,
    });

    onSuccess();
    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit && window.confirm(`Delete event "${eventToEdit.title}"?`)) {
      deleteEvent(eventToEdit.id);
      onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Calendar Event' : 'Create New Event'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Event Title" required>
          <input
            type="text"
            placeholder="e.g. Executive Quarterly OKR Review"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

        {/* Conflict Warning Banner */}
        {conflictWarning && (
          <div className="p-3 bg-amber-950/60 border border-amber-800/80 rounded-lg text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>{conflictWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            >
              <option value="Work">Work</option>
              <option value="Focus">Focus</option>
              <option value="Meeting">Meeting</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
            </select>
          </FormField>

          <FormField label="Location / Link">
            <input
              type="text"
              placeholder="e.g. Conference Room A or Zoom link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none"
            />
          </FormField>
        </div>

        <FormField label="Notes & Details">
          <textarea
            rows={3}
            placeholder="Additional context or agenda notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none resize-none"
          />
        </FormField>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          {eventToEdit ? (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
            >
              Delete Event
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center space-x-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={!!timeError}>
              {eventToEdit ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};