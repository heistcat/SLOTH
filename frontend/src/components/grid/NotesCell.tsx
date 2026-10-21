'use client';

import React, { useState, useEffect, useRef } from 'react';
import { parseNotesPriority } from '@/lib/flagParser';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Check, X } from 'lucide-react';

interface NotesCellProps {
  notes: string;
  onSave: (newNotes: string) => void;
}

export function NotesCell({ notes, onSave }: NotesCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(notes);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(notes);
  }, [notes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const parsed = parseNotesPriority(notes);

  const commitEdit = () => {
    setIsEditing(false);
    if (text !== notes) {
      onSave(text);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setText(notes);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="flex items-center gap-1.5 min-w-[220px]"
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          placeholder="Type note (use !!! for emergency, !! for warning)..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className="w-full px-2 py-0.5 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none ring-1 ring-blue-500"
        />
        <button 
          onMouseDown={(e) => { e.preventDefault(); commitEdit(); }} 
          className="text-emerald-500 hover:text-emerald-400 p-0.5"
          title="Save note"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button 
          onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }} 
          className="text-rose-500 hover:text-rose-400 p-0.5"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      title="Click to edit notes. Prefix with !!! or !! to trigger alert flags."
      className="cursor-pointer group flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors max-w-[320px]"
    >
      {/* Priority Flag Badge */}
      {parsed.flag === 'EMERGENCY' && (
        <span className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase shrink-0",
          parsed.badgeClasses
        )}>
          <AlertTriangle className="w-3 h-3 shrink-0" />
          {parsed.badgeLabel}
        </span>
      )}

      {parsed.flag === 'WARNING' && (
        <span className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase shrink-0",
          parsed.badgeClasses
        )}>
          <AlertCircle className="w-3 h-3 shrink-0" />
          {parsed.badgeLabel}
        </span>
      )}

      {parsed.flag === 'NORMAL' && (
        <span className={cn(
          "inline-flex items-center px-1 rounded text-[10px] font-medium tracking-tight shrink-0",
          parsed.badgeClasses
        )}>
          !
        </span>
      )}

      {/* Note Text */}
      <span className={cn(
        "truncate text-xs",
        parsed.flag === 'EMERGENCY' && "font-semibold text-rose-500 dark:text-rose-400",
        parsed.flag === 'WARNING' && "font-medium text-amber-600 dark:text-amber-400",
        !notes && "text-slate-400 italic"
      )}>
        {parsed.cleanNotes || (notes ? notes : 'Add note...')}
      </span>
    </div>
  );
}
