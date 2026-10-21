'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { LoadRecord, LogisticsStatus } from '@/types/logistics';
import { useTelemetry } from '@/context/TelemetryContext';
import { InlineStatusSelect } from './InlineStatusSelect';
import { InlineEditableCell } from './InlineEditableCell';
import { NotesCell } from './NotesCell';
import { ColumnVisibilityMenu } from './ColumnVisibilityMenu';
import { parseNotesPriority } from '@/lib/flagParser';
import { cn } from '@/lib/utils';
import {
  Search,
  AlertTriangle,
  Radio,
  Navigation as NavIcon,
  Phone,
  MessageSquare,
  ArrowUpDown,
  Filter,
} from 'lucide-react';

interface SmartDataGridProps {
  onNewDispatchClick?: () => void;
}

export function SmartDataGrid({ onNewDispatchClick }: SmartDataGridProps) {
  const {
    loads,
    updateLoadStatus,
    updateLoadField,
    openInspector,
    isSimulating,
    setIsSimulating,
  } = useTelemetry();

  // Search & filter states
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | LogisticsStatus | 'READY_OR_DISPATCHED'>('ALL');
  const [flagsOnlyFilter, setFlagsOnlyFilter] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  // Column visibility with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sloth_column_visibility');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return {
      phone: true,
      cdl: false,
      fuelLevel: true,
      odometer: false,
      deposit: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('sloth_column_visibility', JSON.stringify(columnVisibility));
    } catch {
      // ignore
    }
  }, [columnVisibility]);

  // Define columns according to strict requirements:
  // - Rename Issue -> Attention
  // - Remove MC label completely -> Strictly UNIT
  // - Direct inline editing for STATUS, LOAD/TRIP #, TRAILER, NOTES
  const columns = useMemo<ColumnDef<LoadRecord>[]>(() => [
    {
      id: 'status',
      accessorKey: 'status',
      header: 'STATUS',
      cell: ({ row }) => (
        <InlineStatusSelect
          status={row.original.status}
          onChange={(newStatus) => updateLoadStatus(row.original.id, newStatus)}
        />
      ),
      size: 130,
    },
    {
      id: 'unit',
      accessorFn: (row) => row.truck.unit,
      header: 'UNIT', // Strictly UNIT (#013, #222, etc.)
      cell: ({ row }) => {
        const truck = row.original.truck;
        const isMoving = truck.motionStatus === 'MOVING';
        return (
          <div 
            onClick={() => openInspector(row.original.id)}
            className="flex items-center gap-1.5 font-mono font-bold text-xs cursor-pointer group"
            title="Inspect truck telemetry"
          >
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              isMoving ? "bg-emerald-500 radar-live-dot" : "bg-slate-400 dark:bg-slate-600"
            )} />
            <span className="text-blue-600 dark:text-blue-400 group-hover:underline">
              {truck.unit}
            </span>
          </div>
        );
      },
      size: 85,
    },
    {
      id: 'driverName',
      accessorFn: (row) => row.driver.name,
      header: 'DRIVER NAME',
      cell: ({ row }) => {
        const driver = row.original.driver;
        const msgCount = row.original.telegramMessages.length;
        return (
          <div 
            onClick={() => openInspector(row.original.id)}
            className="flex items-center justify-between gap-1 cursor-pointer group"
            title="Open Telegram feed and driver details"
          >
            <div className="truncate">
              <span className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline">
                {driver.name}
              </span>
              <span className="block text-[10px] text-slate-400">
                HOS: {driver.hos.driveHoursRemaining.toFixed(1)}h drive
              </span>
            </div>
            {msgCount > 0 && (
              <span 
                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-mono bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0"
                title={`${msgCount} Telegram messages`}
              >
                <MessageSquare className="w-2.5 h-2.5" />
                {msgCount}
              </span>
            )}
          </div>
        );
      },
      size: 155,
    },
    {
      id: 'loadNumber',
      accessorKey: 'loadNumber',
      header: 'LOAD / TRIP #',
      cell: ({ row }) => (
        <InlineEditableCell
          value={row.original.loadNumber}
          mono
          onSave={(newVal) => updateLoadField(row.original.id, 'loadNumber', newVal)}
        />
      ),
      size: 125,
    },
    {
      id: 'trailer',
      accessorKey: 'trailer',
      header: 'TRAILER',
      cell: ({ row }) => (
        <InlineEditableCell
          value={row.original.trailer}
          mono
          onSave={(newVal) => updateLoadField(row.original.id, 'trailer', newVal)}
        />
      ),
      size: 105,
    },
    {
      id: 'telemetry',
      header: 'TELEMETRY / MILES LEFT',
      cell: ({ row }) => {
        const load = row.original;
        const truck = load.truck;
        const isMoving = truck.motionStatus === 'MOVING';
        const pctLeft = load.distanceTotal > 0 
          ? Math.round((load.distanceRemaining / load.distanceTotal) * 100) 
          : 0;

        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {load.distanceRemaining} mi left
              </span>
              <span className={cn(
                "text-[10px] px-1 rounded uppercase font-semibold",
                isMoving ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
              )}>
                {isMoving ? `${truck.speedMph} mph` : truck.motionStatus}
              </span>
            </div>
            {load.distanceTotal > 0 && (
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    isMoving ? "bg-sky-500" : "bg-slate-400 dark:bg-slate-600"
                  )}
                  style={{ width: `${Math.max(4, 100 - pctLeft)}%` }}
                />
              </div>
            )}
          </div>
        );
      },
      size: 160,
    },
    {
      id: 'route',
      header: 'ROUTE (PU / DEL)',
      cell: ({ row }) => {
        const load = row.original;
        return (
          <div className="text-xs truncate">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">PU:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{load.puLocation}</span>
              <span className="text-[10px] text-slate-400">({load.puTime})</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">DEL:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{load.delLocation}</span>
              <span className="text-[10px] text-slate-400">({load.delTime})</span>
            </div>
          </div>
        );
      },
      size: 210,
    },
    {
      id: 'notes',
      accessorKey: 'notes',
      header: 'NOTES (PARSER & FLAGS)',
      cell: ({ row }) => (
        <NotesCell
          notes={row.original.notes}
          onSave={(newNotes) => updateLoadField(row.original.id, 'notes', newNotes)}
        />
      ),
      size: 260,
    },
    {
      id: 'phone',
      accessorFn: (row) => row.driver.phone,
      header: 'PHONE',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.driver.phone}
        </span>
      ),
      size: 130,
    },
    {
      id: 'fuelLevel',
      accessorFn: (row) => row.truck.fuelLevel,
      header: 'FUEL',
      cell: ({ row }) => {
        const fuel = row.original.truck.fuelLevel;
        return (
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className={cn(
              "font-medium",
              fuel <= 25 ? "text-rose-500 font-bold" : "text-slate-700 dark:text-slate-300"
            )}>
              {fuel}%
            </span>
          </div>
        );
      },
      size: 75,
    },
    {
      id: 'vin',
      accessorFn: (row) => row.truck.vin,
      header: 'VIN',
      cell: ({ row }) => (
        <span className="font-mono text-[11px] text-slate-500 truncate" title={row.original.truck.vin}>
          {row.original.truck.vin}
        </span>
      ),
      size: 140,
    },
    {
      id: 'cdl',
      accessorFn: (row) => row.driver.cdl,
      header: 'CDL',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-500">
          {row.original.driver.cdl}
        </span>
      ),
      size: 115,
    },
    {
      id: 'odometer',
      accessorFn: (row) => row.truck.odometer,
      header: 'ODOMETER',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
          {row.original.truck.odometer.toLocaleString()}
        </span>
      ),
      size: 105,
    },
  ], [updateLoadStatus, updateLoadField, openInspector]);

  // Custom filtering pipeline
  const filteredData = useMemo(() => {
    return loads.filter((load) => {
      // 1. Status Tab filter
      if (statusTab === 'READY_OR_DISPATCHED') {
        if (load.status !== 'READY' && load.status !== 'DISPATCHED') return false;
      } else if (statusTab !== 'ALL') {
        if (load.status !== statusTab) return false;
      }

      // 2. Flags Only filter (!!! or !!)
      if (flagsOnlyFilter) {
        const parsed = parseNotesPriority(load.notes);
        if (!parsed.isAlert) return false;
      }

      // 3. Global search filter
      if (globalFilter.trim()) {
        const q = globalFilter.toLowerCase();
        const searchCorpus = [
          load.driver.name,
          load.truck.unit,
          load.driver.phone,
          load.trailer,
          load.notes,
          load.loadNumber,
          load.puLocation,
          load.delLocation,
          load.truck.vin,
        ].join(' ').toLowerCase();

        if (!searchCorpus.includes(q)) return false;
      }

      return true;
    });
  }, [loads, statusTab, flagsOnlyFilter, globalFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Calculate quick metrics for summary bar
  const metrics = useMemo(() => {
    const alertCount = loads.filter(l => parseNotesPriority(l.notes).isAlert).length;
    const movingCount = loads.filter(l => l.truck.motionStatus === 'MOVING').length;
    const attentionCount = loads.filter(l => l.status === 'ATTENTION').length;
    const readyCount = loads.filter(l => l.status === 'READY').length;
    return { alertCount, movingCount, attentionCount, readyCount };
  }, [loads]);

  return (
    <div className="space-y-3">
      {/* Top Filter and Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Left Side: Status Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-md border border-slate-200 dark:border-slate-800/80 text-xs">
          <button
            onClick={() => setStatusTab('ALL')}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors",
              statusTab === 'ALL'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            All ({loads.length})
          </button>
          <button
            onClick={() => setStatusTab('READY_OR_DISPATCHED')}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors",
              statusTab === 'READY_OR_DISPATCHED'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            Ready / Needs Dispatch
          </button>
          <button
            onClick={() => setStatusTab('TRANSIT')}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors",
              statusTab === 'TRANSIT'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            In Transit ({metrics.movingCount})
          </button>
          <button
            onClick={() => setStatusTab('ATTENTION')}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1",
              statusTab === 'ATTENTION'
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-rose-500"
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Attention ({metrics.attentionCount})
          </button>
          <button
            onClick={() => setStatusTab('HOME')}
            className={cn(
              "px-2.5 py-1 rounded font-medium transition-colors",
              statusTab === 'HOME'
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            Home
          </button>
        </div>

        {/* Right Side: Search, Flags Toggle, Column Chooser, and Simulation Pulse */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Flags Only Filter Button */}
          <button
            onClick={() => setFlagsOnlyFilter(!flagsOnlyFilter)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all",
              flagsOnlyFilter
                ? "bg-rose-500 text-white border-rose-600 shadow-sm ring-2 ring-rose-500/30"
                : "bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
            title="Isolate rows with Emergency (!!!) or Warning (!!) flags"
          >
            <AlertTriangle className={cn("w-3.5 h-3.5", flagsOnlyFilter ? "text-white" : "text-amber-500")} />
            <span>Flags Only [Red / Yellow]</span>
            {metrics.alertCount > 0 && (
              <span className={cn(
                "px-1 py-0.2 rounded-full text-[10px] font-mono",
                flagsOnlyFilter ? "bg-white/20 text-white" : "bg-rose-500/15 text-rose-500"
              )}>
                {metrics.alertCount}
              </span>
            )}
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search driver, unit, trailer..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
            />
          </div>

          {/* Column Chooser */}
          <ColumnVisibilityMenu table={table} />

          {/* Telemetry Radar Live Indicator */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 text-[11px] rounded-md border font-mono transition-colors",
              isSimulating
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
            )}
            title="Toggle live Samsara GPS telemetry stream"
          >
            <Radio className={cn("w-3 h-3", isSimulating && "animate-pulse")} />
            <span>{isSimulating ? "GPS LIVE" : "GPS PAUSED"}</span>
          </button>

          {/* New Dispatch Button */}
          {onNewDispatchClick && (
            <button
              onClick={onNewDispatchClick}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
            >
              + Dispatch Load
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density Spreadsheet Data Grid */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-230px)]">
          <table className="w-full text-left border-collapse border-spacing-0 text-xs">
            {/* Table Header */}
            <thead className="bg-slate-50 dark:bg-slate-950/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className="py-2 px-2.5 font-semibold text-[11px] tracking-wider text-slate-500 dark:text-slate-400 uppercase select-none border-r border-slate-200/60 dark:border-slate-800/80 last:border-r-0 whitespace-nowrap"
                    >
                      <div 
                        className={cn(
                          "flex items-center gap-1",
                          header.column.getCanSort() && "cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-40 ml-0.5" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>

            {/* Table Body with high density and smooth row hover */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="py-12 text-center text-slate-400 italic text-sm"
                  >
                    No matching dispatch records found.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const isAlertRow = parseNotesPriority(row.original.notes).isAlert;
                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        "group transition-colors duration-100 cursor-default",
                        isAlertRow 
                          ? "bg-rose-50/40 dark:bg-rose-950/15 hover:bg-rose-100/60 dark:hover:bg-rose-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="py-1.5 px-2.5 border-r border-slate-100 dark:border-slate-800/60 last:border-r-0 align-middle"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* High-density grid footer status bar */}
        <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredData.length}</span> of {loads.length} units
          </div>
          <div className="flex items-center gap-4">
            <span>⚡ Telemetry: <span className="text-emerald-500">Connected</span></span>
            <span>📱 Telegram Webhook: <span className="text-sky-500">Active</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
