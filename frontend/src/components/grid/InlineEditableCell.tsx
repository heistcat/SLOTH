'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

interface InlineEditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  mono?: boolean;
}

export function InlineEditableCell({
  value,
  onSave,
  placeholder = 'Click to edit',
  className,
  mono = false,
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commitEdit = () => {
    setIsEditing(false);
    if (currentVal !== value) {
      onSave(currentVal);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setCurrentVal(value);
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
        className="flex items-center gap-1 min-w-[90px]"
      >
        <input
          ref={inputRef}
          type="text"
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitEdit}
          className={cn(
            "w-full px-1.5 py-0.5 text-xs bg-white dark:bg-slate-900 border border-blue-500 rounded text-slate-900 dark:text-slate-100 focus:outline-none ring-1 ring-blue-500",
            mono && "font-mono"
          )}
        />
        <button 
          onMouseDown={(e) => { e.preventDefault(); commitEdit(); }} 
          className="text-emerald-500 hover:text-emerald-400 p-0.5"
          title="Save"
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
      title="Click to edit"
      className={cn(
        "cursor-pointer group flex items-center gap-1 px-1.5 py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors",
        mono && "font-mono",
        className
      )}
    >
      <span className={cn(
        "truncate text-xs",
        !value && "text-slate-400 italic font-sans"
      )}>
        {value || placeholder}
      </span>
    </div>
  );
}
