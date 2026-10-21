'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Columns, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Table } from '@tanstack/react-table';
import { LoadRecord } from '@/types/logistics';

interface ColumnVisibilityMenuProps {
  table: Table<LoadRecord>;
}

export function ColumnVisibilityMenu({ table }: ColumnVisibilityMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const allColumns = table.getAllLeafColumns();

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors focus:outline-none"
      >
        <Columns className="w-3.5 h-3.5 text-slate-500" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs focus:outline-none max-h-72 overflow-y-auto">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-semibold text-[11px] text-slate-500 uppercase tracking-wider">
            Toggle Columns
          </div>
          <div className="p-1 space-y-0.5">
            {allColumns.map((col) => {
              const header = typeof col.columnDef.header === 'string' 
                ? col.columnDef.header 
                : col.id;
              const isVisible = col.getIsVisible();

              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => col.toggleVisibility()}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 flex items-center justify-between rounded hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-slate-700 dark:text-slate-300",
                    isVisible && "font-medium"
                  )}
                >
                  <span className="capitalize">{header}</span>
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    isVisible 
                      ? "bg-blue-600 border-blue-600 text-white" 
                      : "border-slate-300 dark:border-slate-700 bg-transparent"
                  )}>
                    {isVisible && <Check className="w-3 h-3 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
