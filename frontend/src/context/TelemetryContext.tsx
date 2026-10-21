'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { LoadRecord, LogisticsStatus, TelegramMessage } from '@/types/logistics';
import { initialSlothLoads } from '@/lib/mockSlothData';
import { parseNotesPriority } from '@/lib/flagParser';

interface TelemetryContextType {
  loads: LoadRecord[];
  activeInspectors: string[]; // List of load IDs currently open in floating windows
  minimizedInspectors: Record<string, boolean>;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  openInspector: (loadId: string) => void;
  closeInspector: (loadId: string) => void;
  toggleMinimizeInspector: (loadId: string) => void;
  updateLoadStatus: (loadId: string, newStatus: LogisticsStatus) => void;
  updateLoadField: (loadId: string, field: 'loadNumber' | 'trailer' | 'notes' | 'price' | 'deposit', value: any) => void;
  sendTelegramMessage: (loadId: string, text: string) => void;
  addNewLoad: (newLoad: Omit<LoadRecord, 'id' | 'updatedAt' | 'priorityFlag' | 'telegramMessages'>) => void;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [loads, setLoads] = useState<LoadRecord[]>([]);
  const [activeInspectors, setActiveInspectors] = useState<string[]>([]);
  const [minimizedInspectors, setMinimizedInspectors] = useState<Record<string, boolean>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Initialize from localStorage or mock data
  useEffect(() => {
    const saved = localStorage.getItem('sloth_loads_data');
    if (saved) {
      try {
        setLoads(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to load saved loads', e);
      }
    }
    setLoads(initialSlothLoads);
  }, []);

  // Save to localStorage on changes
  const saveLoads = useCallback((updated: LoadRecord[]) => {
    setLoads(updated);
    try {
      localStorage.setItem('sloth_loads_data', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save loads to storage', e);
    }
  }, []);

  // Telemetry simulation engine: Decrements miles left on moving trucks, simulates GPS telemetry
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setLoads(prevLoads => {
        return prevLoads.map(load => {
          if (load.status === 'TRANSIT' && load.truck.motionStatus === 'MOVING') {
            const milesDeduction = Math.floor(Math.random() * 2) + 1; // 1-2 miles per tick
            const newRemaining = Math.max(0, load.distanceRemaining - milesDeduction);
            const speedFluctuation = Math.min(72, Math.max(58, load.truck.speedMph + (Math.random() > 0.5 ? 1 : -1)));

            return {
              ...load,
              distanceRemaining: newRemaining,
              truck: {
                ...load.truck,
                speedMph: speedFluctuation,
                odometer: load.truck.odometer + milesDeduction,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return load;
        });
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Open a floating inspector window
  const openInspector = useCallback((loadId: string) => {
    setActiveInspectors(prev => {
      if (!prev.includes(loadId)) {
        return [...prev, loadId];
      }
      return prev;
    });
    // Un-minimize if it was minimized
    setMinimizedInspectors(prev => ({ ...prev, [loadId]: false }));
  }, []);

  // Close a floating inspector window
  const closeInspector = useCallback((loadId: string) => {
    setActiveInspectors(prev => prev.filter(id => id !== loadId));
    setMinimizedInspectors(prev => {
      const copy = { ...prev };
      delete copy[loadId];
      return copy;
    });
  }, []);

  // Toggle minimize state
  const toggleMinimizeInspector = useCallback((loadId: string) => {
    setMinimizedInspectors(prev => ({
      ...prev,
      [loadId]: !prev[loadId],
    }));
  }, []);

  // Update load status instantly (Optimistic update)
  const updateLoadStatus = useCallback((loadId: string, newStatus: LogisticsStatus) => {
    setLoads(prev => {
      const updated = prev.map(load => {
        if (load.id === loadId) {
          // If status changes to HOME or READY, adjust motion accordingly
          let newMotion = load.truck.motionStatus;
          if (newStatus === 'HOME' || newStatus === 'READY') {
            newMotion = 'PARKED';
          } else if (newStatus === 'TRANSIT') {
            newMotion = 'MOVING';
          }
          return {
            ...load,
            status: newStatus,
            truck: {
              ...load.truck,
              motionStatus: newMotion,
              speedMph: newMotion === 'MOVING' ? 62 : 0,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return load;
      });
      saveLoads(updated);
      return updated;
    });
  }, [saveLoads]);

  // Inline editable cell updater
  const updateLoadField = useCallback((
    loadId: string, 
    field: 'loadNumber' | 'trailer' | 'notes' | 'price' | 'deposit', 
    value: any
  ) => {
    setLoads(prev => {
      const updated = prev.map(load => {
        if (load.id === loadId) {
          const mod = { ...load, [field]: value };
          if (field === 'notes') {
            const parsed = parseNotesPriority(value);
            mod.priorityFlag = parsed.flag;
          }
          mod.updatedAt = new Date().toISOString();
          return mod;
        }
        return load;
      });
      saveLoads(updated);
      return updated;
    });
  }, [saveLoads]);

  // Send a Telegram message from dispatcher to driver
  const sendTelegramMessage = useCallback((loadId: string, text: string) => {
    if (!text.trim()) return;

    const newMessage: TelegramMessage = {
      id: `tg-msg-${Date.now()}`,
      loadId,
      sender: 'dispatcher',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLoads(prev => {
      const updated = prev.map(load => {
        if (load.id === loadId) {
          return {
            ...load,
            telegramMessages: [...load.telegramMessages, newMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return load;
      });
      saveLoads(updated);
      return updated;
    });

    // Simulate an automated bot or driver acknowledgment after 3 seconds
    setTimeout(() => {
      setLoads(prev => {
        const targetLoad = prev.find(l => l.id === loadId);
        if (!targetLoad) return prev;

        const botReply: TelegramMessage = {
          id: `tg-msg-bot-${Date.now()}`,
          loadId,
          sender: 'driver',
          text: `Roger that dispatch, received your message.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        const updated = prev.map(load => {
          if (load.id === loadId) {
            return {
              ...load,
              telegramMessages: [...load.telegramMessages, botReply],
              updatedAt: new Date().toISOString(),
            };
          }
          return load;
        });
        saveLoads(updated);
        return updated;
      });
    }, 2800);
  }, [saveLoads]);

  // Add new load from Wizard
  const addNewLoad = useCallback((newLoadData: Omit<LoadRecord, 'id' | 'updatedAt' | 'priorityFlag' | 'telegramMessages'>) => {
    const parsedNotes = parseNotesPriority(newLoadData.notes);
    const newLoad: LoadRecord = {
      ...newLoadData,
      id: `load-${Date.now()}`,
      priorityFlag: parsedNotes.flag,
      updatedAt: new Date().toISOString(),
      telegramMessages: [
        {
          id: `tg-init-${Date.now()}`,
          sender: 'bot',
          text: `🚀 Load #${newLoadData.loadNumber} dispatched to ${newLoadData.driver.name}. Trailer: ${newLoadData.trailer}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setLoads(prev => {
      const updated = [newLoad, ...prev];
      saveLoads(updated);
      return updated;
    });
  }, [saveLoads]);

  return (
    <TelemetryContext.Provider value={{
      loads,
      activeInspectors,
      minimizedInspectors,
      isSimulating,
      setIsSimulating,
      openInspector,
      closeInspector,
      toggleMinimizeInspector,
      updateLoadStatus,
      updateLoadField,
      sendTelegramMessage,
      addNewLoad,
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within TelemetryProvider');
  return context;
}
