import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getEvents, getTimeBlocks, getActiveDate, setActiveDate, subscribeToDataChanges } from '@/services/dataService';
import { CalendarEvent, TimeBlock } from '@/types';
import { EventModal } from '@/components/calendar/EventModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  FileText,
  Edit3,
} from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage: React.FC = () => {
  const [selectedDateStr, setSelectedDateStrState] = useState<string>(getActiveDate());
  const [currentDate, setCurrentDate] = useState(new Date(`${getActiveDate()}T00:00:00`));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);

  const setSelectedDateStr = (dStr: string) => {
    setSelectedDateStrState(dStr);
    setActiveDate(dStr);
  };

  const refreshEventsAndBlocks = () => {
    setEvents(getEvents());
    setTimeBlocks(getTimeBlocks());
    const sharedActive = getActiveDate();
    if (sharedActive !== selectedDateStr) {
      setSelectedDateStrState(sharedActive);
    }
  };

  useEffect(() => {
    refreshEventsAndBlocks();
    const unsubscribe = subscribeToDataChanges(refreshEventsAndBlocks);
    return unsubscribe;
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setCurrentDate(today);
    setSelectedDateStr(todayStr);
  };

  const firstDayOfMonthIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const formatCellDate = (dYear: number, dMonth: number, dDay: number) => {
    const m = String(dMonth + 1).padStart(2, '0');
    const d = String(dDay).padStart(2, '0');
    return `${dYear}-${m}-${d}`;
  };

  // Selected Day Merged Items
  const selectedDayEvents = events.filter((e) => e.date === selectedDateStr);
  const selectedDayTimeBlocks = timeBlocks.filter((tb) => tb.date === selectedDateStr);

  const handleOpenCreateModal = (dateStr?: string) => {
    if (dateStr) setSelectedDateStr(dateStr);
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (evt: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setEventToEdit(evt);
    setIsModalOpen(true);
  };

  const getCategoryPillStyle = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'work':
        return 'bg-teal-950 text-teal-300 border-teal-800/80';
      case 'focus':
        return 'bg-purple-950 text-purple-300 border-purple-800/80';
      case 'meeting':
        return 'bg-sky-950 text-sky-300 border-sky-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Build Grid Cells Matrix
  const gridCells = [];

  for (let i = firstDayOfMonthIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, dayNum);
    const dateStr = formatCellDate(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), dayNum);
    gridCells.push({ dayNum, dateStr, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatCellDate(year, month, d);
    gridCells.push({ dayNum: d, dateStr, isCurrentMonth: true });
  }

  const totalCellsSoFar = gridCells.length;
  const targetTotal = totalCellsSoFar > 35 ? 42 : 35;
  for (let nextD = 1; nextD <= targetTotal - totalCellsSoFar; nextD++) {
    const nextMonthDate = new Date(year, month + 1, nextD);
    const dateStr = formatCellDate(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), nextD);
    gridCells.push({ dayNum: nextD, dateStr, isCurrentMonth: false });
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="text-teal-400" size={22} />
            {monthName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Interactive schedule grid and event time block manager.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs font-semibold"
          >
            Today
          </Button>

          <div className="flex items-center space-x-1 border border-slate-800 rounded-lg p-0.5 bg-slate-950">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => handleOpenCreateModal(selectedDateStr)}
          >
            + New Event
          </Button>
        </div>
      </div>

      {/* Main Grid & Selected Day Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Grid View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/60 text-center py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            {WEEKDAYS.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 bg-slate-950 gap-[1px] flex-1">
            {gridCells.map((cell) => {
              const isToday = cell.dateStr === todayStr;
              const isSelected = cell.dateStr === selectedDateStr;
              const cellEvents = events.filter((e) => e.date === cell.dateStr);
              const cellTimeBlocks = timeBlocks.filter((tb) => tb.date === cell.dateStr);
              const totalItemsCount = cellEvents.length + cellTimeBlocks.length;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 bg-slate-900 flex flex-col justify-between cursor-pointer transition-colors relative group ${
                    !cell.isCurrentMonth ? 'opacity-40 bg-slate-900/50' : 'hover:bg-slate-800/60'
                  } ${isSelected ? 'ring-2 ring-teal-500 ring-inset bg-teal-950/20 z-10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-teal-500 text-slate-950 font-black'
                          : isSelected
                          ? 'text-teal-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateModal(cell.dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-teal-400 p-0.5 rounded transition-opacity"
                      aria-label={`Add event for ${cell.dateStr}`}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Combined Events & TimeBlocks Pills */}
                  <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                    {cellEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => handleOpenEditModal(evt, e)}
                        className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold truncate ${getCategoryPillStyle(
                          evt.category
                        )}`}
                      >
                        {evt.title}
                      </div>
                    ))}

                    {cellTimeBlocks.slice(0, Math.max(0, 2 - cellEvents.length)).map((tb) => (
                      <div
                        key={tb.id}
                        className="px-1.5 py-0.5 rounded border border-purple-800/80 bg-purple-950/60 text-purple-300 text-[10px] font-semibold truncate"
                      >
                        {tb.startTime} {tb.title}
                      </div>
                    ))}

                    {totalItemsCount > 2 && (
                      <span className="text-[10px] text-slate-400 font-mono block pl-1">
                        +{totalItemsCount - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Side Panel */}
        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center justify-between w-full">
                <span className="text-xs sm:text-sm font-bold text-slate-100">
                  {new Date(`${selectedDateStr}T00:00:00`).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <StatusBadge
                  label={`${selectedDayEvents.length + selectedDayTimeBlocks.length} Item(s)`}
                  variant="teal"
                  size="sm"
                />
              </div>
            }
          >
            {selectedDayEvents.length > 0 || selectedDayTimeBlocks.length > 0 ? (
              <div className="space-y-3">
                {/* Events Section */}
                {selectedDayEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-sky-950 text-sky-300 border border-sky-800">
                            Event
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-100">{evt.title}</h4>
                        </div>
                        <span className="text-[10px] text-teal-400 font-mono font-semibold flex items-center gap-1 mt-1">
                          <Clock size={11} /> {evt.startTime.includes('T') ? new Date(evt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : evt.startTime} - {evt.endTime.includes('T') ? new Date(evt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : evt.endTime}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleOpenEditModal(evt, e)}
                        className="p-1 text-slate-400 hover:text-teal-400 hover:bg-slate-900 rounded transition-colors"
                      >
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Time Blocks Section */}
                {selectedDayTimeBlocks.map((tb) => (
                  <div
                    key={tb.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-purple-950 text-purple-300 border border-purple-800">
                        Time Block
                      </span>
                      <h4 className={`text-xs font-bold ${tb.done ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {tb.title}
                      </h4>
                    </div>
                    <p className="text-[10px] text-purple-300 font-mono">
                      {tb.startTime} - {tb.endTime} ({tb.category})
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarIcon size={22} />}
                title="No Items Scheduled"
                description="No events or time blocks recorded for this date."
                actionLabel="+ Add Event"
                onAction={() => handleOpenCreateModal(selectedDateStr)}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Event Modal Dialog */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={eventToEdit}
        defaultDateStr={selectedDateStr}
        existingEvents={events}
        onSuccess={refreshEventsAndBlocks}
      />
    </div>
  );
};

export default CalendarPage;