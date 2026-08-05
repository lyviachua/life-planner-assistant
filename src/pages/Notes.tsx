import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { getNotes, saveNote, deleteNote, togglePinNote, subscribeToDataChanges } from '@/services/dataService';
import { Note } from '@/types';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Tag,
  Check,
  Save,
  Clock,
  Sparkles,
} from 'lucide-react';

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Editor form state
  const [editorTitle, setEditorTitle] = useState('');
  const [editorBody, setEditorBody] = useState('');
  const [editorTags, setEditorTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Auto-save status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshNotes = () => {
    const loadedNotes = getNotes();
    setNotes(loadedNotes);

    if (!selectedNoteId && loadedNotes.length > 0) {
      setSelectedNoteId(loadedNotes[0].id);
    }
  };

  useEffect(() => {
    refreshNotes();
    const unsubscribe = subscribeToDataChanges(refreshNotes);
    return unsubscribe;
  }, []);

  // Sync selected note into editor
  useEffect(() => {
    if (selectedNoteId) {
      const current = notes.find((n) => n.id === selectedNoteId);
      if (current) {
        setEditorTitle(current.title);
        setEditorBody(current.body);
        setEditorTags(current.tags || []);
        setSaveStatus('idle');
      }
    }
  }, [selectedNoteId, notes]);

  // Execute Save API
  const performSave = () => {
    if (!selectedNoteId || !editorTitle.trim()) return;

    setSaveStatus('saving');
    saveNote({
      id: selectedNoteId,
      title: editorTitle.trim(),
      body: editorBody,
      tags: editorTags,
    });

    setTimeout(() => {
      setSaveStatus('saved');
    }, 400);
  };

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        performSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteId, editorTitle, editorBody, editorTags]);

  // Auto-Save 2 second idle debounce
  const handleContentChange = (newTitle: string, newBody: string) => {
    setEditorTitle(newTitle);
    setEditorBody(newBody);
    setSaveStatus('idle');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 2000);
  };

  const handleCreateNewNote = () => {
    const newN = saveNote({
      title: 'Untitled Note',
      body: '',
      tags: [],
      pinned: false,
    });
    setSelectedNoteId(newN.id);
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Delete this note permanently?')) {
      deleteNote(id);
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editorTags.includes(tagInput.trim())) {
        const updated = [...editorTags, tagInput.trim()];
        setEditorTags(updated);
        performSave();
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = editorTags.filter((t) => t !== tagToRemove);
    setEditorTags(updated);
    performSave();
  };

  // Gather unique tags across notes
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = selectedTag ? n.tags?.includes(selectedTag) : true;

    return matchesSearch && matchesTag;
  });

  // Sort notes: pinned notes first, then latest updated
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="text-teal-400" size={22} />
            Personal Information Manager & Markdown Notes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-saving markdown scratchpad with tag categorization and Ctrl+S shortcuts.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={handleCreateNewNote}>
          + New Note
        </Button>
      </div>

      {/* Two-Column Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[720px]">
        {/* Left Column: Note List & Search Sidebar (1 Span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
          {/* Search & Tag Filter Header */}
          <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/60">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-1.5 pl-8 pr-3 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Tag Pills Filter Bar */}
            {allTags.length > 0 && (
              <div className="flex items-center gap-1 overflow-x-auto py-1 text-[10px] font-mono">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-2 py-0.5 rounded ${
                    selectedTag === null ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  All Tags
                </button>
                {allTags.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                    className={`px-2 py-0.5 rounded whitespace-nowrap ${
                      selectedTag === t ? 'bg-teal-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Note Selection List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
            {sortedNotes.length > 0 ? (
              sortedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3.5 cursor-pointer transition-colors space-y-1.5 ${
                    selectedNoteId === note.id ? 'bg-teal-950/30 border-l-2 border-teal-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5">
                      {note.pinned && <Pin size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
                      {note.title || 'Untitled Note'}
                    </h2>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinNote(note.id);
                        }}
                        className={`p-1 rounded hover:bg-slate-800 ${note.pinned ? 'text-amber-400' : 'text-slate-500'}`}
                      >
                        <Pin size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {note.body || 'No contents written yet...'}
                  </p>

                  <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono pt-1">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    {note.tags && note.tags.length > 0 && (
                      <span className="text-teal-400">#{note.tags.join(' #')}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<FileText size={22} />}
                title="No Notes Found"
                description="Create a note to start capturing information."
                actionLabel="+ Create Note"
                onAction={handleCreateNewNote}
              />
            )}
          </div>
        </div>

        {/* Right Column: Markdown Note Editor (2 Spans) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg flex flex-col overflow-hidden">
          {activeNote ? (
            <>
              {/* Editor Header: Auto-Save Status & Actions */}
              <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
                {/* Auto Save Status Banner */}
                <div className="flex items-center space-x-2 text-xs">
                  {saveStatus === 'saving' && (
                    <span className="text-amber-400 font-mono flex items-center gap-1">
                      <Clock size={13} className="animate-spin" /> Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                      <Check size={13} /> Saved (Auto-save)
                    </span>
                  )}
                  {saveStatus === 'idle' && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      Press Ctrl+S or pause typing to auto-save
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Save size={13} />}
                    onClick={performSave}
                    className="text-xs py-1"
                  >
                    Save (Ctrl+S)
                  </Button>
                </div>
              </div>

              {/* Title & Tag Editing Header */}
              <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900">
                <input
                  type="text"
                  placeholder="Note Title..."
                  value={editorTitle}
                  onChange={(e) => handleContentChange(e.target.value, editorBody)}
                  className="w-full text-base sm:text-lg font-bold bg-transparent text-slate-100 outline-none border-b border-transparent focus:border-teal-500/50 pb-1"
                />

                {/* Tags input bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <Tag size={13} className="text-teal-400 shrink-0" />
                  {editorTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-mono bg-teal-950 text-teal-300 border border-teal-800 rounded-md flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    placeholder="+ Add tag (Press Enter)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="px-2 py-0.5 text-[10px] bg-slate-950 border border-slate-800 rounded text-slate-300 outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Editor Workspace Textarea */}
              <div className="flex-1 p-4 bg-slate-950">
                <textarea
                  value={editorBody}
                  onChange={(e) => handleContentChange(editorTitle, e.target.value)}
                  placeholder="Write note content or markdown notes here..."
                  className="w-full h-full bg-transparent text-slate-200 text-xs sm:text-sm font-mono leading-relaxed outline-none resize-none"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <FileText size={48} className="mb-3 text-slate-700" />
              <p className="text-sm font-semibold">No Note Selected</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                Select a note from the left sidebar or create a new markdown note.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;