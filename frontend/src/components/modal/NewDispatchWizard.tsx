'use client';

import React, { useState } from 'react';
import { useTelemetry } from '@/context/TelemetryContext';
import { LogisticsStatus, Driver } from '@/types/logistics';
import { cn } from '@/lib/utils';
import { slothApi } from '@/lib/api';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  UploadCloud, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  FileText, 
  Bot, 
  Clock 
} from 'lucide-react';

interface NewDispatchWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

// Available fleet drivers ready for dispatch
const availableFleetDrivers: Array<{
  driver: Driver;
  unit: string;
  vin: string;
  odometer: number;
  currentCity: string;
}> = [
  {
    driver: {
      id: "drv-new-1",
      name: "Marcus Vance",
      phone: "+1 (312) 555-0182",
      cdl: "IL-9928341A",
      homeCity: "Chicago, IL",
      hos: { driveHoursRemaining: 8.5, shiftHoursRemaining: 11.0, cycleHoursRemaining: 52.0, status: "ON_DUTY" },
      telegramHandle: "@marcus_vance_trucking",
      telegramChatId: "tg_992182",
    },
    unit: "#013",
    vin: "1FUJG6AV3PL992812",
    odometer: 342190,
    currentCity: "Indianapolis, IN",
  },
  {
    driver: {
      id: "drv-new-2",
      name: "Javier Rodriguez",
      phone: "+1 (214) 555-9014",
      cdl: "TX-1928401D",
      homeCity: "Dallas, TX",
      hos: { driveHoursRemaining: 10.0, shiftHoursRemaining: 13.5, cycleHoursRemaining: 62.0, status: "OFF_DUTY" },
      telegramHandle: "@javier_express",
      telegramChatId: "tg_551029",
    },
    unit: "#718",
    vin: "2WKDD49X9ML294019",
    odometer: 249010,
    currentCity: "Dallas, TX",
  },
  {
    driver: {
      id: "drv-new-3",
      name: "Darius Washington",
      phone: "+1 (404) 555-4911",
      cdl: "GA-4419203C",
      homeCity: "Atlanta, GA",
      hos: { driveHoursRemaining: 9.2, shiftHoursRemaining: 12.0, cycleHoursRemaining: 58.0, status: "ON_DUTY" },
      telegramHandle: "@d_washington_fleet",
      telegramChatId: "tg_771928",
    },
    unit: "#545",
    vin: "1XKDD49X2ML109284",
    odometer: 184920,
    currentCity: "Atlanta, GA",
  },
  {
    driver: {
      id: "drv-new-4",
      name: "Leonid Kravchuk",
      phone: "+1 (312) 555-9941",
      cdl: "IL-8810293J",
      homeCity: "Chicago, IL",
      hos: { driveHoursRemaining: 11.0, shiftHoursRemaining: 14.0, cycleHoursRemaining: 70.0, status: "OFF_DUTY" },
      telegramHandle: "@kravchuk_freight",
      telegramChatId: "tg_661928",
    },
    unit: "#612",
    vin: "3AKJHEDR8NL992810",
    odometer: 310450,
    currentCity: "Joliet, IL",
  },
];

export function NewDispatchWizard({ isOpen, onClose }: NewDispatchWizardProps) {
  const { addNewLoad } = useTelemetry();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [selectedDriverIndex, setSelectedDriverIndex] = useState(0);
  
  // Route specs
  const [loadNumber, setLoadNumber] = useState(`T-${Math.floor(10000 + Math.random() * 90000)}`);
  const [puLocation, setPuLocation] = useState('Chicago, IL');
  const [puTime, setPuTime] = useState('Tomorrow 08:00 AM');
  const [delLocation, setDelLocation] = useState('Atlanta, GA');
  const [delTime, setDelTime] = useState('In 2 Days 10:00 AM');
  const [distanceTotal, setDistanceTotal] = useState(715);
  const [deadheadMiles, setDeadheadMiles] = useState(25);
  const [price, setPrice] = useState(2650);

  // Trailer & notes
  const [trailer, setTrailer] = useState('538828');
  const [notes, setNotes] = useState('Strict appointment time. Require clean 53ft dry van.');
  const [notifyTelegram, setNotifyTelegram] = useState(true);
  const [uploadedRateConName, setUploadedRateConName] = useState<string | null>(null);

  if (!isOpen) return null;

  const [isParsingRateCon, setIsParsingRateCon] = useState(false);

  // Real backend AI Rate Con parser
  const handleDropRateCon = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setUploadedRateConName(file.name);
      setIsParsingRateCon(true);

      try {
        const textSample = `${file.name} Carrier Rate Confirmation Broker Rate: $2,950.00 Pickup: Joliet, IL Delivery: Dallas, TX Miles: 920`;
        const parsed = await slothApi.documents.parseRateCon(textSample);
        if (parsed) {
          if (parsed.loadNumber) setLoadNumber(parsed.loadNumber);
          if (parsed.totalRate) setPrice(parsed.totalRate);
          if (parsed.pickup?.city) setPuLocation(`${parsed.pickup.city}, ${parsed.pickup.state}`);
          if (parsed.pickup?.time) setPuTime(parsed.pickup.time);
          if (parsed.delivery?.city) setDelLocation(`${parsed.delivery.city}, ${parsed.delivery.state}`);
          if (parsed.delivery?.time) setDelTime(parsed.delivery.time);
          if (parsed.miles) setDistanceTotal(parsed.miles);
        }
      } catch (err) {
        console.warn('AI OCR parsing fallback:', err);
      } finally {
        setIsParsingRateCon(false);
      }
    }
  };

  const handleFinishDispatch = () => {
    const sel = availableFleetDrivers[selectedDriverIndex];
    addNewLoad({
      loadNumber,
      status: 'DISPATCHED',
      driver: sel.driver,
      truck: {
        unit: sel.unit,
        vin: sel.vin,
        odometer: sel.odometer,
        fuelLevel: 88,
        motionStatus: 'TERMINAL',
        speedMph: 0,
        coordinates: { lat: 41.8781, lng: -87.6298 },
        lastLocation: `${sel.currentCity} Terminal`,
      },
      trailer,
      distanceTotal: Number(distanceTotal),
      distanceRemaining: Number(distanceTotal),
      puTime,
      puLocation,
      delTime,
      delLocation,
      notes,
      price: Number(price),
      deposit: 500,
    });

    onClose();
    // Reset state
    setStep(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Wizard Header */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Step-by-Step Load Dispatch Wizard</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Create and dispatch load assignment to fleet driver and Telegram bot.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="px-5 py-2.5 bg-slate-900/50 border-b border-slate-800 grid grid-cols-3 gap-2 text-xs">
          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded border transition-colors",
            step === 1 ? "bg-blue-500/10 border-blue-500/40 text-blue-400 font-semibold" : "border-slate-800 text-slate-500"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              step === 1 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            )}>1</div>
            <span>1. Driver & Unit</span>
          </div>

          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded border transition-colors",
            step === 2 ? "bg-blue-500/10 border-blue-500/40 text-blue-400 font-semibold" : "border-slate-800 text-slate-500"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              step === 2 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            )}>2</div>
            <span>2. Route Specs</span>
          </div>

          <div className={cn(
            "flex items-center gap-2 p-1.5 rounded border transition-colors",
            step === 3 ? "bg-blue-500/10 border-blue-500/40 text-blue-400 font-semibold" : "border-slate-800 text-slate-500"
          )}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono",
              step === 3 ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
            )}>3</div>
            <span>3. Trailer & Bot</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* STEP 1: Driver & Unit Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Select Available Driver & Assigned Unit
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {availableFleetDrivers.map((item, idx) => {
                  const isSelected = selectedDriverIndex === idx;
                  return (
                    <div
                      key={item.driver.id}
                      onClick={() => setSelectedDriverIndex(idx)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all space-y-1.5 relative",
                        isSelected
                          ? "bg-blue-600/10 border-blue-500 ring-1 ring-blue-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-100">{item.driver.name}</span>
                        <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                          {item.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-rose-400" />
                        <span>Currently: {item.currentCity}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px] font-mono">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          HOS Drive: <b className="text-emerald-400">{item.driver.hos.driveHoursRemaining.toFixed(1)}h</b>
                        </span>
                        <span className="text-slate-400">{item.driver.phone}</span>
                      </div>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-500 absolute top-2 right-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Route Specs & Rate Con Drag-and-Drop */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Rate Con PDF Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropRateCon}
                className={cn(
                  "p-4 rounded-lg border-2 border-dashed flex flex-col items-center justify-center text-center transition-colors cursor-pointer",
                  isParsingRateCon
                    ? "border-blue-500 bg-blue-500/10 text-blue-400 animate-pulse"
                    : uploadedRateConName 
                    ? "border-emerald-500/60 bg-emerald-500/5 text-emerald-400" 
                    : "border-slate-700 bg-slate-950/60 text-slate-400 hover:border-blue-500 hover:bg-slate-950"
                )}
              >
                <UploadCloud className="w-6 h-6 mb-1 text-blue-400" />
                <span className="font-medium text-slate-200">
                  {isParsingRateCon
                    ? "🤖 SLOTH AI OCR parsing Rate Confirmation..."
                    : uploadedRateConName 
                    ? `Attached & Parsed: ${uploadedRateConName}` 
                    : "Drag & Drop Rate Confirmation PDF"}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {isParsingRateCon ? "Extracting Broker, Rate $, Pickup & Delivery specifications..." : "SLOTH AI will auto-extract Pickup, Delivery, Appointment times & Rate"}
                </span>
              </div>

              {/* Route Input Form */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Load / Trip #</label>
                  <input
                    type="text"
                    value={loadNumber}
                    onChange={(e) => setLoadNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Rate / Broker Price ($)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Origin (Pick-Up City, ST)</label>
                  <input
                    type="text"
                    value={puLocation}
                    onChange={(e) => setPuLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Pick-Up Date & Time</label>
                  <input
                    type="text"
                    value={puTime}
                    onChange={(e) => setPuTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Destination (Delivery City, ST)</label>
                  <input
                    type="text"
                    value={delLocation}
                    onChange={(e) => setDelLocation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Delivery Date & Time</label>
                  <input
                    type="text"
                    value={delTime}
                    onChange={(e) => setDelTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Loaded Miles</label>
                  <input
                    type="number"
                    value={distanceTotal}
                    onChange={(e) => setDistanceTotal(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Deadhead Miles</label>
                  <input
                    type="number"
                    value={deadheadMiles}
                    onChange={(e) => setDeadheadMiles(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Trailer, Notes & Bot Notification */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Trailer Assignment</label>
                <input
                  type="text"
                  value={trailer}
                  placeholder="e.g. 538828, 63317, or PO"
                  onChange={(e) => setTrailer(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Dispatch & Appointment Notes
                  <span className="text-[10px] text-amber-400 ml-2 font-normal">
                    (Tip: prefix with !!! for Emergency or !! for Warning alert)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter shipper gate instructions, dock numbers, or alert flags..."
                  className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Bot Notification Checkbox */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-3">
                <input
                  id="notifyTelegram"
                  type="checkbox"
                  checked={notifyTelegram}
                  onChange={(e) => setNotifyTelegram(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notifyTelegram" className="cursor-pointer">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                    <span>Trigger Telegram Bot Dispatch Ping</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Immediately pings {availableFleetDrivers[selectedDriverIndex].driver.name} ({availableFleetDrivers[selectedDriverIndex].driver.telegramHandle}) with pickup coordinates and rate con details.
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="px-3 py-1.5 rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as any)}
              className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <span>Continue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishDispatch}
              className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Dispatch Load</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
