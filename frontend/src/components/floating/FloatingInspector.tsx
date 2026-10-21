'use client';

import React, { useState, useRef, useEffect } from 'react';
import { LoadRecord } from '@/types/logistics';
import { useTelemetry } from '@/context/TelemetryContext';
import { TelemetryPanel } from './TelemetryPanel';
import { TelegramFeed } from './TelegramFeed';
import { cn } from '@/lib/utils';
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  Radio, 
  MessageSquare, 
  GripHorizontal 
} from 'lucide-react';

interface FloatingInspectorProps {
  loadId: string;
  defaultPosition?: { x: number; y: number };
}

export function FloatingInspector({ loadId, defaultPosition }: FloatingInspectorProps) {
  const { loads, closeInspector, minimizedInspectors, toggleMinimizeInspector } = useTelemetry();
  const load = loads.find(l => l.id === loadId);

  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'TELEGRAM'>('TELEMETRY');
  
  // Position & size state
  const [position, setPosition] = useState(defaultPosition || { x: 80, y: 100 });
  const [size, setSize] = useState({ width: 440, height: 530 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [prevBounds, setPrevBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  // Resizing state
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; startWidth: number; startHeight: number }>({ mouseX: 0, mouseY: 0, startWidth: 0, startHeight: 0 });

  const isMinimized = !!minimizedInspectors[loadId];

  // Mouse move handler for Dragging
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (isDragging) {
        const dx = e.clientX - dragStartRef.current.mouseX;
        const dy = e.clientY - dragStartRef.current.mouseY;
        const newX = Math.max(10, Math.min(window.innerWidth - 120, dragStartRef.current.startX + dx));
        const newY = Math.max(10, Math.min(window.innerHeight - 80, dragStartRef.current.startY + dy));
        setPosition({ x: newX, y: newY });
      } else if (isResizing) {
        const dx = e.clientX - resizeStartRef.current.mouseX;
        const dy = e.clientY - resizeStartRef.current.mouseY;
        const newW = Math.max(340, Math.min(window.innerWidth - 40, resizeStartRef.current.startWidth + dx));
        const newH = Math.max(380, Math.min(window.innerHeight - 40, resizeStartRef.current.startHeight + dy));
        setSize({ width: newW, height: newH });
      }
    }

    function handleMouseUp() {
      setIsDragging(false);
      setIsResizing(false);
    }

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  if (!load) return null;

  // Handle Drag Start
  const handleDragStart = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  // Handle Resize Start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  };

  // Toggle Maximize
  const handleToggleMaximize = () => {
    if (!isMaximized) {
      setPrevBounds({ ...position, ...size });
      setPosition({ x: 20, y: 70 });
      setSize({ width: window.innerWidth - 40, height: window.innerHeight - 100 });
      setIsMaximized(true);
    } else {
      if (prevBounds) {
        setPosition({ x: prevBounds.x, y: prevBounds.y });
        setSize({ width: prevBounds.width, height: prevBounds.height });
      }
      setIsMaximized(false);
    }
  };

  // If minimized, render as a compact floating dock pill
  if (isMinimized) {
    return (
      <div 
        onClick={() => toggleMinimizeInspector(loadId)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white shadow-2xl cursor-pointer hover:bg-slate-800 transition-all font-mono text-xs"
        title="Click to restore inspector window"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 radar-live-dot" />
        <span className="font-bold text-sky-400">{load.truck.unit}</span>
        <span className="text-slate-300 font-sans">{load.driver.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            closeInspector(loadId);
          }}
          className="ml-2 text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      className={cn(
        "fixed top-0 left-0 z-50 flex flex-col rounded-xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl backdrop-blur-xl overflow-hidden select-none transition-shadow",
        isDragging && "opacity-95 shadow-blue-500/10 cursor-grabbing ring-1 ring-blue-500",
        isResizing && "select-none ring-1 ring-blue-500"
      )}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleDragStart}
        className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
            {load.truck.unit}
          </span>
          <span className="font-semibold text-xs text-slate-200">
            {load.driver.name}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({load.loadNumber})
          </span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleMinimizeInspector(loadId)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleToggleMaximize}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => closeInspector(loadId)}
            className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="px-3 pt-2 bg-slate-950 flex items-center gap-2 border-b border-slate-800 text-xs shrink-0">
        <button
          onClick={() => setActiveTab('TELEMETRY')}
          className={cn(
            "pb-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors",
            activeTab === 'TELEMETRY'
              ? "border-blue-500 text-blue-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Telemetry & GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('TELEGRAM')}
          className={cn(
            "pb-2 font-medium flex items-center gap-1.5 border-b-2 transition-colors",
            activeTab === 'TELEGRAM'
              ? "border-sky-500 text-sky-400 font-semibold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Telegram Feed ({load.telegramMessages.length})</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'TELEMETRY' ? (
          <TelemetryPanel load={load} />
        ) : (
          <TelegramFeed load={load} />
        )}
      </div>

      {/* Resize Grip (Bottom Right) */}
      {!isMaximized && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize flex items-center justify-center text-slate-600 hover:text-slate-400"
          title="Drag to resize"
        >
          <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
            <path d="M6 6H0L6 0V6Z" />
          </svg>
        </div>
      )}
    </div>
  );
}
