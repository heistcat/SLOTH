import { LoadRecord, LogisticsStatus, PriorityFlag } from "@/types/logistics";
import { parseNotesPriority } from "./flagParser";

const API_BASE = '/api/v1';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('sloth_access_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// ----------------------------------------------------
// DATA ADAPTER: Backend models.Load -> Frontend LoadRecord
// ----------------------------------------------------

export function adaptBackendLoad(backendLoad: any): LoadRecord {
  const driverName = backendLoad.driver?.fullName || backendLoad.driverName || 'Unassigned Driver';
  const driverPhone = backendLoad.driver?.phone || '+1 (555) 000-0000';
  const driverCDL = backendLoad.driver?.licenseNumber || 'CDL-PENDING';
  const driverHOS = backendLoad.driver?.hosDriveHours ?? 8.0;

  const unitNumber = backendLoad.truck?.unitNumber || backendLoad.unit || '#000';
  const vin = backendLoad.truck?.vin || 'VIN-UNKNOWN';
  const speed = backendLoad.truck?.speedMph ?? 0;
  const motionStatus = backendLoad.truck?.motionStatus || (speed > 5 ? 'MOVING' : 'PARKED');
  const fuel = backendLoad.truck?.fuelLevel ?? 75;
  const odometer = backendLoad.truck?.odometer ?? 100000;
  const lat = backendLoad.truck?.latitude ?? 39.7684;
  const lng = backendLoad.truck?.longitude ?? -86.1581;
  const lastLocation = backendLoad.truck?.lastLocation || `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;

  let puLocation = 'Origin';
  let puTime = 'Pending';
  let delLocation = 'Destination';
  let delTime = 'Pending';

  if (backendLoad.stops && backendLoad.stops.length > 0) {
    const pickupStop = backendLoad.stops.find((s: any) => s.stopType === 'PICKUP') || backendLoad.stops[0];
    const delStop = backendLoad.stops.find((s: any) => s.stopType === 'DELIVERY') || backendLoad.stops[backendLoad.stops.length - 1];

    if (pickupStop) {
      puLocation = `${pickupStop.city}, ${pickupStop.state}`;
      puTime = pickupStop.scheduledTime || 'Scheduled';
    }
    if (delStop) {
      delLocation = `${delStop.city}, ${delStop.state}`;
      delTime = delStop.scheduledTime || 'Scheduled';
    }
  }

  const notes = backendLoad.notes || '';
  const parsedFlag = parseNotesPriority(notes).flag;

  return {
    id: backendLoad.id,
    loadNumber: backendLoad.loadNumber || 'PENDING',
    status: (backendLoad.status as LogisticsStatus) || 'READY',
    trailer: backendLoad.trailerNumber || backendLoad.trailer || '538828',
    distanceTotal: (backendLoad.loadedMiles || 0) + (backendLoad.deadheadMiles || 0) || 750,
    distanceRemaining: backendLoad.milesLeft ?? 300,
    puLocation,
    puTime,
    delLocation,
    delTime,
    notes,
    price: backendLoad.rate || 0,
    deposit: 500,
    priorityFlag: parsedFlag,
    driver: {
      id: backendLoad.driver?.id || 'drv-unknown',
      name: driverName,
      phone: driverPhone,
      cdl: driverCDL,
      homeCity: backendLoad.driver?.homeCity || 'Chicago, IL',
      hos: {
        driveHoursRemaining: driverHOS,
        shiftHoursRemaining: Math.min(14, driverHOS + 2.5),
        cycleHoursRemaining: 50,
        status: speed > 5 ? 'DRIVING' : 'ON_DUTY',
      },
      telegramHandle: `@${driverName.toLowerCase().replace(/\s+/g, '_')}`,
      telegramChatId: backendLoad.driver?.telegramChatId || 'tg_unknown',
    },
    truck: {
      unit: unitNumber,
      vin,
      odometer,
      fuelLevel: fuel,
      motionStatus,
      speedMph: speed,
      coordinates: { lat, lng },
      lastLocation,
      engineTempF: 195,
      oilPressurePsi: 42,
      batteryVolts: 13.9,
    },
    telegramMessages: backendLoad.telegramMessages || [],
    updatedAt: backendLoad.updatedAt || new Date().toISOString(),
  };
}

// ----------------------------------------------------
// API METHODS
// ----------------------------------------------------

export const slothApi = {
  // Auth
  auth: {
    login: (username: string, password: string) => 
      request<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  // Loads (Grid)
  loads: {
    getAll: async (params?: { status?: string; flags?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status && params.status !== 'ALL') q.set('status', params.status);
      if (params?.flags) q.set('flags', params.flags);
      if (params?.search) q.set('search', params.search);

      const qs = q.toString() ? `?${q.toString()}` : '';
      const resp = await request<{ data: any[]; total: number }>(`/loads${qs}`);
      return (resp.data || []).map(adaptBackendLoad);
    },

    getById: async (id: string) => {
      const data = await request<any>(`/loads/${id}`);
      return adaptBackendLoad(data);
    },

    patchInline: async (id: string, patch: { status?: string; loadNumber?: string; trailerNumber?: string; notes?: string }) => {
      const data = await request<any>(`/loads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      return adaptBackendLoad(data);
    },

    create: async (loadPayload: any) => {
      const data = await request<any>('/loads', {
        method: 'POST',
        body: JSON.stringify(loadPayload),
      });
      return adaptBackendLoad(data);
    },
  },

  // Telematics
  telematics: {
    ping: (payload: { deviceId: string; lat: number; lng: number; speedMph: number; odometer: number; engineState: string; hosRemainingDriveSeconds: number }) =>
      request<any>('/telematics/ping', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Telegram
  telegram: {
    getHistory: (driverId: string) =>
      request<any[]>(`/telegram/drivers/${driverId}/history`),

    send: (driverId: string, text: string) =>
      request<any>(`/telegram/drivers/${driverId}/send`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  },

  // Document OCR
  documents: {
    parseRateCon: (rawText: string, documentUrl?: string) =>
      request<any>('/documents/parse-ratecon', {
        method: 'POST',
        body: JSON.stringify({ rawText, documentUrl }),
      }),
  },

  // Public Tracking
  tracking: {
    getPublic: (token: string) =>
      request<any>(`/tracking/public/${token}`),
  },
};
