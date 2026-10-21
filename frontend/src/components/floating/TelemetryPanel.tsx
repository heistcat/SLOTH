'use client';

import React from 'react';
import { LoadRecord } from '@/types/logistics';
import { cn } from '@/lib/utils';
import { 
  Navigation, 
  Gauge, 
  Clock, 
  Battery, 
  Flame, 
  MapPin, 
  Compass, 
  Radio 
} from 'lucide-react';

interface TelemetryPanelProps {
  load: LoadRecord;
}

export function TelemetryPanel({ load }: TelemetryPanelProps) {
  const { truck, driver, distanceTotal, distanceRemaining } = load;
  const isMoving = truck.motionStatus === 'MOVING';
  const pctLeft = distanceTotal > 0 
    ? Math.round((distanceRemaining / distanceTotal) * 100) 
    : 0;

  return (
    <div className="space-y-4 text-xs">
      {/* Motion & Speed Status Card */}
      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-white space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              isMoving ? "bg-emerald-400 radar-live-dot" : "bg-slate-500"
            )} />
            <span className="font-mono font-bold text-sm tracking-wide">
              {truck.unit} &middot; {truck.motionStatus}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {truck.speedMph} MPH
          </span>
        </div>

        {/* Live GPS Coordinates and Location */}
        <div className="flex items-start gap-2 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-slate-200">{truck.lastLocation}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              GPS: {truck.coordinates.lat.toFixed(4)}° N, {Math.abs(truck.coordinates.lng).toFixed(4)}° W
            </div>
          </div>
        </div>

        {/* Distance Progress */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Miles Remaining:</span>
            <span className="font-bold text-emerald-400">{distanceRemaining} mi / {distanceTotal} mi</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${Math.max(5, 100 - pctLeft)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Driver HOS Clocks (FMCSA Compliance) */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            HOS Clocks ({driver.name})
          </span>
          <span className={cn(
            "px-1.5 py-0.2 rounded text-[10px] font-mono font-bold",
            driver.hos.status === 'DRIVING' ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
          )}>
            {driver.hos.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Drive Left</div>
            <div className={cn(
              "font-mono font-bold text-sm mt-0.5",
              driver.hos.driveHoursRemaining < 2 ? "text-rose-500" : "text-slate-800 dark:text-slate-200"
            )}>
              {driver.hos.driveHoursRemaining.toFixed(1)}h
            </div>
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Shift Left</div>
            <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
              {driver.hos.shiftHoursRemaining.toFixed(1)}h
            </div>
          </div>

          <div className="p-2 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-400">Cycle Left</div>
            <div className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200 mt-0.5">
              {driver.hos.cycleHoursRemaining.toFixed(1)}h
            </div>
          </div>
        </div>
      </div>

      {/* Samsara Engine Telematics & Sensors */}
      <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>Engine Telematics (Samsara ELD)</span>
          <span className="font-mono text-[10px] text-emerald-500">CANBUS OK</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
          <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Fuel Level:</span>
            <span className={cn(
              "font-mono font-semibold",
              truck.fuelLevel < 25 ? "text-rose-500" : "text-slate-900 dark:text-slate-100"
            )}>
              {truck.fuelLevel}%
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Odometer:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {truck.odometer.toLocaleString()} mi
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Coolant Temp:</span>
            <span className={cn(
              "font-mono font-semibold",
              (truck.engineTempF || 195) > 210 ? "text-rose-500" : "text-slate-900 dark:text-slate-100"
            )}>
              {truck.engineTempF || 195}°F
            </span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400">Battery:</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {truck.batteryVolts || 13.8}V
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
