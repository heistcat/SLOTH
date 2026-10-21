'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LogisticsStatus } from '@/types/logistics';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineStatusSelectProps {
  status: LogisticsStatus;
  onChange: (newStatus: LogisticsStatus) => void;
  disabled?: boolean;
}

interface StatusConfig {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export const statusConfigs: Record<LogisticsStatus, StatusConfig> = {
  READY: {
    label: 'READY',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-800',
    dotClass: 'bg-emerald-500',
  },
  DISPATCHED: {
    label: 'DISPATCHED',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
    dotClass: 'bg-amber-500',
  },
  RESERVED: {
    label: 'RESERVED',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
    dotClass: 'bg-emerald-400',
  },
  TRANSIT: {
    label: 'IN TRANSIT',
    badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60',
    dotClass: 'bg-sky-500 animate-pulse',
  },
  ATTENTION: {
    label: 'ATTENTION',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    dotClass: 'bg-rose-500 animate-ping',
  },
  HOME: {
    label: 'HOME',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40',
    dotClass: 'bg-purple-400',
  },
};

const allStatuses: LogisticsStatus[] = [
  'READY',
  'DISPATCHED',
  'RESERVED',
  'TRANSIT',
  'ATTENTION',
  'HOME',
];

export function InlineStatusSelect({ status, onChange, disabled }: InlineStatusSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentConfig = statusConfigs[status] || statusConfigs.READY;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  const handleSelect = (s: LogisticsStatus) => {
    onChange(s);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border transition-all select-none cursor-pointer hover:ring-1 hover:ring-slate-400 dark:hover:ring-slate-600",
          currentConfig.badgeClass,
          disabled && "opacity-60 cursor-not-allowed"
        )}
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", currentConfig.dotClass)} />
        <span>{currentConfig.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 mt-1 min-w-[140px] rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1 text-xs focus:outline-none"
        >
          {allStatuses.map((s) => {
            const cfg = statusConfigs[s];
            const isSelected = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => handleSelect(s)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                  isSelected && "font-bold text-blue-600 dark:text-blue-400"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
                  <span className="text-[11px]">{cfg.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
