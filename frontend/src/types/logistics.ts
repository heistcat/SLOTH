export type LogisticsStatus = 
  | 'READY' 
  | 'DISPATCHED' 
  | 'RESERVED' 
  | 'TRANSIT' 
  | 'ATTENTION' 
  | 'HOME';

export type PriorityFlag = 'EMERGENCY' | 'WARNING' | 'NORMAL' | 'NONE';

export type UserRole = 
  | 'ADMIN' 
  | 'DISPATCHER' 
  | 'SAFETY/TELEMATICS'
  | 'Superadmin'
  | 'Admin'
  | 'Manager'
  | 'Supervisor'
  | 'Maintenance'
  | 'Accounting';

export type MotionStatus = 'MOVING' | 'PARKED' | 'TERMINAL';

export interface DriverHOS {
  driveHoursRemaining: number; // e.g., 6.5 hrs
  shiftHoursRemaining: number; // e.g., 9.2 hrs
  cycleHoursRemaining: number; // e.g., 42.0 hrs
  status: 'DRIVING' | 'ON_DUTY' | 'SLEEPER' | 'OFF_DUTY';
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  cdl: string;
  homeCity: string;
  hos: DriverHOS;
  telegramHandle: string;
  telegramChatId: string;
  avatarUrl?: string;
}

export interface TruckTelemetry {
  unit: string; // Strictly UNIT e.g., '#013'
  vin: string;
  odometer: number;
  fuelLevel: number; // 0 to 100 percentage
  motionStatus: MotionStatus;
  speedMph: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  lastLocation: string; // e.g., 'Gary, IN (I-80 W MM 12)'
  engineTempF?: number;
  oilPressurePsi?: number;
  batteryVolts?: number;
}

export interface TelegramMessage {
  id: string;
  loadId?: string;
  sender: 'bot' | 'driver' | 'dispatcher';
  text: string;
  timestamp: string;
  attachment?: {
    type: 'bol' | 'ratecon' | 'inspection' | 'receipt';
    url: string;
    title: string;
  };
}

export interface LoadRecord {
  id: string;
  loadNumber: string; // Direct editable text cell
  status: LogisticsStatus; // Direct interactive Select
  driver: Driver;
  truck: TruckTelemetry;
  trailer: string; // Direct editable text cell
  distanceTotal: number;
  distanceRemaining: number; // Decrements via live telemetry
  puTime: string;
  puLocation: string;
  delTime: string;
  delLocation: string;
  notes: string; // Direct editable text cell with '!' parser
  price: number;
  deposit?: number;
  rateConUrl?: string;
  priorityFlag: PriorityFlag;
  telegramMessages: TelegramMessage[];
  updatedAt: string;
}
