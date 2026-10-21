'use client';

import React, { useState } from 'react';
import { SmartDataGrid } from '@/components/grid/SmartDataGrid';
import { FloatingInspector } from '@/components/floating/FloatingInspector';
import { NewDispatchWizard } from '@/components/modal/NewDispatchWizard';
import { useTelemetry } from '@/context/TelemetryContext';
import { parseNotesPriority } from '@/lib/flagParser';
import { Truck, Navigation, AlertTriangle, CheckCircle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { loads, activeInspectors } = useTelemetry();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Quick live metrics
  const totalFleet = loads.length;
  const movingNow = loads.filter(l => l.truck.motionStatus === 'MOVING').length;
  const readyCount = loads.filter(l => l.status === 'READY').length;
  const attentionAlerts = loads.filter(l => parseNotesPriority(l.notes).isAlert).length;

  return (
    <div className="space-y-4">
      {/* Top Fleet Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Units */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Fleet Active
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
              {totalFleet} <span className="text-xs font-normal text-slate-400">units</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        {/* Moving Now (Live Telemetry) */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 radar-live-dot" />
              <span>Moving Live</span>
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {movingNow} <span className="text-xs font-normal text-slate-400">in motion</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Navigation className="w-4 h-4" />
          </div>
        </div>

        {/* Ready to Dispatch */}
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Available / Ready
            </div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {readyCount} <span className="text-xs font-normal text-slate-400">drivers</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Priority Attention Flags */}
        <div className={cn(
          "p-3 rounded-lg border shadow-sm flex items-center justify-between transition-colors",
          attentionAlerts > 0
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50"
            : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
        )}>
          <div>
            <div className="text-[11px] font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Flags & Attention
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              {attentionAlerts} <span className="text-xs font-normal text-slate-400">alerts</span>
            </div>
          </div>
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            attentionAlerts > 0 
              ? "bg-rose-500 text-white animate-pulse" 
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
          )}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main High-Density Smart Table */}
      <SmartDataGrid onNewDispatchClick={() => setIsWizardOpen(true)} />

      {/* Step-by-Step Load Dispatch Wizard Modal */}
      <NewDispatchWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      {/* Draggable & Resizable Floating Inspector Windows */}
      {activeInspectors.map((loadId, index) => {
        // Offset each newly opened window slightly
        const offset = 80 + (index * 30);
        return (
          <FloatingInspector
            key={loadId}
            loadId={loadId}
            defaultPosition={{ x: offset, y: offset }}
          />
        );
      })}
    </div>
  );
}
