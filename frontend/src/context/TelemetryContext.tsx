'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { LoadRecord, LogisticsStatus, TelegramMessage } from '@/types/logistics';
import { initialSlothLoads } from '@/lib/mockSlothData';
import { parseNotesPriority } from '@/lib/flagParser';
import { slothApi, adaptBackendLoad } from '@/lib/api';

interface TelemetryContextType {
  loads: LoadRecord[];
  activeInspectors: string[];
  minimizedInspectors: Record<string, boolean>;
  isSimulating: boolean;
  isWsConnected: boolean;
  setIsSimulating: (val: boolean) => void;
  openInspector: (loadId: string) => void;
  closeInspector: (loadId: string) => void;
  toggleMinimizeInspector: (loadId: string) => void;
  updateLoadStatus: (loadId: string, newStatus: LogisticsStatus) => void;
  updateLoadField: (loadId: string, field: 'loadNumber' | 'trailer' | 'notes' | 'price' | 'deposit', value: any) => void;
  sendTelegramMessage: (loadId: string, text: string) => void;
  addNewLoad: (newLoad: Omit<LoadRecord, 'id' | 'updatedAt' | 'priorityFlag' | 'telegramMessages'>) => void;
  refreshLoads: () => Promise<void>;
}

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export function TelemetryProvider({ children }: { children: ReactNode }) {
  const [loads, setLoads] = useState<LoadRecord[]>([]);
  const [activeInspectors, setActiveInspectors] = useState<string[]>([]);
  const [minimizedInspectors, setMinimizedInspectors] = useState<Record<string, boolean>>({});
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch loads from Go Backend API
  const refreshLoads = useCallback(async () => {
    try {
      const backendLoads = await slothApi.loads.getAll();
      if (backendLoads && backendLoads.length > 0) {
        setLoads(backendLoads);
        return;
      }
    } catch (err) {
      console.warn('[SLOTH] Backend API not reachable yet, falling back to local dataset', err);
    }
    // Fallback to initial mock if API isn't responding yet
    const saved = localStorage.getItem('sloth_loads_data');
    if (saved) {
      try {
        setLoads(JSON.parse(saved));
        return;
      } catch {
        // ignore
      }
    }
    setLoads(initialSlothLoads);
  }, []);

  useEffect(() => {
    refreshLoads();
  }, [refreshLoads]);

  // Persist loads locally as backup
  useEffect(() => {
    if (loads.length > 0) {
      try {
        localStorage.setItem('sloth_loads_data', JSON.stringify(loads));
      } catch {
        // ignore
      }
    }
  }, [loads]);

  // ----------------------------------------------------
  // WEBSOCKET GATEWAY (/dispatch-live)
  // ----------------------------------------------------
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    function connectWebSocket() {
      if (typeof window === 'undefined') return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/dispatch-live?company_id=comp-master-001`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsWsConnected(true);
          console.log('[SLOTH WS] Connected to live dispatch gateway');
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleWsEvent(msg);
          } catch (e) {
            // ignore non-json pings
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          console.log('[SLOTH WS] Gateway disconnected, retrying in 3s...');
          reconnectTimeout = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    }

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Handle incoming real-time events from Go Backend
  const handleWsEvent = (event: { type: string; payload: any }) => {
    switch (event.type) {
      case 'LOAD_UPDATED': {
        const updated = adaptBackendLoad(event.payload);
        setLoads(prev => {
          const exists = prev.some(l => l.id === updated.id);
          if (exists) {
            return prev.map(l => (l.id === updated.id ? updated : l));
          }
          return [updated, ...prev];
        });
        break;
      }

      case 'TELEMETRY_TICK': {
        const { unit, speedMph, motionStatus, milesLeft, odometer, lat, lng } = event.payload;
        setLoads(prev => prev.map(load => {
          if (load.truck.unit === unit || load.truck.unit === `#${unit}`) {
            return {
              ...load,
              distanceRemaining: milesLeft !== undefined && milesLeft > 0 ? milesLeft : load.distanceRemaining,
              truck: {
                ...load.truck,
                speedMph: speedMph ?? load.truck.speedMph,
                motionStatus: motionStatus ?? load.truck.motionStatus,
                odometer: odometer ?? load.truck.odometer,
                coordinates: lat && lng ? { lat, lng } : load.truck.coordinates,
              },
              updatedAt: new Date().toISOString(),
            };
          }
          return load;
        }));
        break;
      }

      case 'ATTENTION_RAISED': {
        const { loadId, alert, message } = event.payload;
        setLoads(prev => prev.map(load => {
          if (load.id === loadId) {
            return {
              ...load,
              status: 'ATTENTION',
              priorityFlag: 'EMERGENCY',
              notes: message || load.notes,
              updatedAt: new Date().toISOString(),
            };
          }
          return load;
        }));
        break;
      }

      case 'TELEGRAM_MESSAGE_RECEIVED': {
        const newMsg: TelegramMessage = {
          id: event.payload.id || `tg-${Date.now()}`,
          sender: event.payload.sender || 'driver',
          text: event.payload.text,
          timestamp: event.payload.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment: event.payload.mediaUrl ? {
            type: 'bol',
            url: event.payload.mediaUrl,
            title: 'Uploaded_Document.jpg',
          } : undefined,
        };

        setLoads(prev => prev.map(load => {
          if (load.id === event.payload.loadId || load.driver.id === event.payload.driverId) {
            return {
              ...load,
              telegramMessages: [...load.telegramMessages, newMsg],
              updatedAt: new Date().toISOString(),
            };
          }
          return load;
        }));
        break;
      }
    }
  };

  // Open / Close / Minimize floating inspector
  const openInspector = useCallback((loadId: string) => {
    setActiveInspectors(prev => (prev.includes(loadId) ? prev : [...prev, loadId]));
    setMinimizedInspectors(prev => ({ ...prev, [loadId]: false }));
  }, []);

  const closeInspector = useCallback((loadId: string) => {
    setActiveInspectors(prev => prev.filter(id => id !== loadId));
    setMinimizedInspectors(prev => {
      const copy = { ...prev };
      delete copy[loadId];
      return copy;
    });
  }, []);

  const toggleMinimizeInspector = useCallback((loadId: string) => {
    setMinimizedInspectors(prev => ({ ...prev, [loadId]: !prev[loadId] }));
  }, []);

  // Update Status Inline (Optimistic + Backend PATCH)
  const updateLoadStatus = useCallback(async (loadId: string, newStatus: LogisticsStatus) => {
    // 1. Optimistic UI update
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        let newMotion = load.truck.motionStatus;
        if (newStatus === 'HOME' || newStatus === 'READY') newMotion = 'PARKED';
        else if (newStatus === 'TRANSIT') newMotion = 'MOVING';

        return {
          ...load,
          status: newStatus,
          truck: { ...load.truck, motionStatus: newMotion, speedMph: newMotion === 'MOVING' ? 64 : 0 },
          updatedAt: new Date().toISOString(),
        };
      }
      return load;
    }));

    // 2. Send to Go backend
    try {
      await slothApi.loads.patchInline(loadId, { status: newStatus });
    } catch (err) {
      console.warn('[SLOTH API] Status update error:', err);
    }
  }, []);

  // Update Field Inline (Optimistic + Backend PATCH)
  const updateLoadField = useCallback(async (
    loadId: string,
    field: 'loadNumber' | 'trailer' | 'notes' | 'price' | 'deposit',
    value: any
  ) => {
    // 1. Optimistic UI update
    setLoads(prev => prev.map(load => {
      if (load.id === loadId) {
        const mod = { ...load, [field]: value };
        if (field === 'notes') {
          mod.priorityFlag = parseNotesPriority(value).flag;
        }
        mod.updatedAt = new Date().toISOString();
        return mod;
      }
      return load;
    }));

    // 2. Send to Go backend
    try {
      const patchPayload: Record<string, any> = {};
      if (field === 'loadNumber') patchPayload.loadNumber = value;
      else if (field === 'trailer') patchPayload.trailerNumber = value;
      else if (field === 'notes') patchPayload.notes = value;

      if (Object.keys(patchPayload).length > 0) {
        await slothApi.loads.patchInline(loadId, patchPayload);
      }
    } catch (err) {
      console.warn('[SLOTH API] Field update error:', err);
    }
  }, []);

  // Send Telegram Message to Driver (Optimistic + Backend POST)
  const sendTelegramMessage = useCallback(async (loadId: string, text: string) => {
    if (!text.trim()) return;

    const targetLoad = loads.find(l => l.id === loadId);
    const driverId = targetLoad?.driver.id || 'drv-01';

    const localMsg: TelegramMessage = {
      id: `tg-msg-${Date.now()}`,
      sender: 'dispatcher',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 1. Optimistic UI update
    setLoads(prev => prev.map(l => {
      if (l.id === loadId) {
        return {
          ...l,
          telegramMessages: [...l.telegramMessages, localMsg],
          updatedAt: new Date().toISOString(),
        };
      }
      return l;
    }));

    // 2. Send to Go backend
    try {
      await slothApi.telegram.send(driverId, text.trim());
    } catch (err) {
      console.warn('[SLOTH API] Failed to send Telegram message:', err);
    }
  }, [loads]);

  // Add New Load from Wizard (Optimistic + Backend POST)
  const addNewLoad = useCallback(async (newLoadData: Omit<LoadRecord, 'id' | 'updatedAt' | 'priorityFlag' | 'telegramMessages'>) => {
    const parsedNotes = parseNotesPriority(newLoadData.notes);
    const localLoad: LoadRecord = {
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

    // 1. Optimistic UI update
    setLoads(prev => [localLoad, ...prev]);

    // 2. Send to Go backend
    try {
      const backendPayload = {
        loadNumber: newLoadData.loadNumber,
        brokerName: 'Broker Direct',
        rate: newLoadData.price,
        status: newLoadData.status,
        driverId: newLoadData.driver.id,
        truckId: 'trk-01',
        trailerNumber: newLoadData.trailer,
        notes: newLoadData.notes,
        deadheadMiles: 25,
        loadedMiles: newLoadData.distanceTotal,
        stops: [
          {
            stopType: 'PICKUP',
            sequenceOrder: 1,
            facilityName: 'Shipper Facility',
            address: newLoadData.puLocation,
            city: newLoadData.puLocation.split(',')[0] || newLoadData.puLocation,
            state: newLoadData.puLocation.split(',')[1]?.trim() || 'IL',
            scheduledTime: newLoadData.puTime,
          },
          {
            stopType: 'DELIVERY',
            sequenceOrder: 2,
            facilityName: 'Consignee Receiver',
            address: newLoadData.delLocation,
            city: newLoadData.delLocation.split(',')[0] || newLoadData.delLocation,
            state: newLoadData.delLocation.split(',')[1]?.trim() || 'GA',
            scheduledTime: newLoadData.delTime,
          },
        ],
      };

      await slothApi.loads.create(backendPayload);
    } catch (err) {
      console.warn('[SLOTH API] Failed to create load on backend:', err);
    }
  }, []);

  return (
    <TelemetryContext.Provider value={{
      loads,
      activeInspectors,
      minimizedInspectors,
      isSimulating,
      isWsConnected,
      setIsSimulating,
      openInspector,
      closeInspector,
      toggleMinimizeInspector,
      updateLoadStatus,
      updateLoadField,
      sendTelegramMessage,
      addNewLoad,
      refreshLoads,
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
