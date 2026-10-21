import { PriorityFlag } from "@/types/logistics";

export interface ParsedNotesResult {
  flag: PriorityFlag;
  cleanNotes: string;
  rawFlagToken: string;
  isAlert: boolean; // true if EMERGENCY (!!!) or WARNING (!!)
  badgeLabel: string | null;
  badgeClasses: string;
}

/**
 * Parses notes text to extract priority flags:
 * - '!!!' -> Emergency / Red Alert
 * - '!!'  -> Warning / Yellow Alert
 * - '!'   -> Normal Priority
 */
export function parseNotesPriority(notes: string | undefined | null): ParsedNotesResult {
  if (!notes || !notes.trim()) {
    return {
      flag: 'NONE',
      cleanNotes: '',
      rawFlagToken: '',
      isAlert: false,
      badgeLabel: null,
      badgeClasses: '',
    };
  }

  const trimmed = notes.trim();

  // Check for triple exclamation mark first
  if (trimmed.includes('!!!')) {
    const clean = trimmed.replace(/!{3,}/g, '').trim();
    return {
      flag: 'EMERGENCY',
      cleanNotes: clean || trimmed,
      rawFlagToken: '!!!',
      isAlert: true,
      badgeLabel: 'RED ALERT',
      badgeClasses: 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse',
    };
  }

  // Check for double exclamation mark
  if (trimmed.includes('!!')) {
    const clean = trimmed.replace(/!{2}/g, '').trim();
    return {
      flag: 'WARNING',
      cleanNotes: clean || trimmed,
      rawFlagToken: '!!',
      isAlert: true,
      badgeLabel: 'YELLOW ALERT',
      badgeClasses: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
    };
  }

  // Check for single exclamation mark at start or word boundary
  if (/^!(\s|$)/.test(trimmed) || /\s!(\s|$)/.test(trimmed)) {
    const clean = trimmed.replace(/^!\s*/, '').trim();
    return {
      flag: 'NORMAL',
      cleanNotes: clean || trimmed,
      rawFlagToken: '!',
      isAlert: false,
      badgeLabel: 'PRIORITY',
      badgeClasses: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
    };
  }

  return {
    flag: 'NONE',
    cleanNotes: trimmed,
    rawFlagToken: '',
    isAlert: false,
    badgeLabel: null,
    badgeClasses: '',
  };
}
