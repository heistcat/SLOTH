'use client';

import React, { useState, useMemo } from 'react';
import { useTelemetry } from '@/context/TelemetryContext';
import { formatCurrency, formatMiles } from '@/lib/utils';
import { DollarSign, Download, Search, TrendingUp, Fuel, Calculator, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountingPage() {
  const { loads } = useTelemetry();
  const [search, setSearch] = useState('');

  // Dynamically derive accounting settlements from real active loads
  const settlements = useMemo(() => {
    return loads.map(load => {
      const price = load.price || 2400;
      const miles = load.distanceTotal || 700;
      const paycheck = Math.round(price * 0.72); // 72% driver split
      const cashAdvance = price > 2000 ? 300 : 150;
      const reimbursement = 45; // Tolls / scale tickets
      const trlRent = 50;
      const truckRent = 150;
      const fuelCost = Math.round((miles / 6.5) * 3.85); // 6.5 MPG @ $3.85/gal
      const driverExpense = 35;
      const deposit = load.deposit || 500;
      const netPay = paycheck + reimbursement - cashAdvance - trlRent - truckRent - driverExpense;

      return {
        id: `STL-${load.loadNumber}`,
        loadNumber: load.loadNumber,
        driverName: load.driver.name,
        unit: load.truck.unit,
        status: load.status,
        price,
        paycheck,
        miles,
        cashAdvance,
        reimbursement,
        trlRent,
        truckRent,
        fuelCost,
        driverExpense,
        deposit,
        netPay,
      };
    });
  }, [loads]);

  const filtered = useMemo(() => {
    return settlements.filter(row => 
      row.loadNumber.toLowerCase().includes(search.toLowerCase()) ||
      row.driverName.toLowerCase().includes(search.toLowerCase()) ||
      row.unit.toLowerCase().includes(search.toLowerCase()) ||
      row.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [settlements, search]);

  // Aggregate KPI metrics
  const totals = useMemo(() => {
    const gross = filtered.reduce((acc, curr) => acc + curr.price, 0);
    const pay = filtered.reduce((acc, curr) => acc + curr.paycheck, 0);
    const fuel = filtered.reduce((acc, curr) => acc + curr.fuelCost, 0);
    const netMargin = gross - pay - fuel;
    return { gross, pay, fuel, netMargin };
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Top Settlement KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Gross Freight Revenue
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(totals.gross)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Driver Settlements
            </div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {formatCurrency(totals.pay)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Estimated Fuel Cost
            </div>
            <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              {formatCurrency(totals.fuel)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Fuel className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Net Fleet Margin
            </div>
            <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
              {formatCurrency(totals.netMargin)}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Accounting Header & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Accounting & Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time settlement calculation derived from active fleet dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search load, driver, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
            />
          </div>

          <button
            onClick={() => alert(`Exporting ${filtered.length} settlement records to CSV...`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Settlement ID</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Load #</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Driver</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Unit</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Status</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Gross Price</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Paycheck (72%)</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Miles</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Cash Adv</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Reimb</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">TRL Rent</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Truck Rent</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Est. Fuel</th>
                <th className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">Net Due Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(row => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap text-slate-800 dark:text-slate-200"
                >
                  <td className="p-2.5 font-mono text-slate-400 border-r border-slate-100 dark:border-slate-800/60">{row.id}</td>
                  <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800/60">{row.loadNumber}</td>
                  <td className="p-2.5 font-medium border-r border-slate-100 dark:border-slate-800/60">{row.driverName}</td>
                  <td className="p-2.5 font-mono font-bold text-sky-500 border-r border-slate-100 dark:border-slate-800/60">{row.unit}</td>
                  <td className="p-2.5 border-r border-slate-100 dark:border-slate-800/60">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50">
                      {row.status}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-right font-medium text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/60">{formatCurrency(row.price)}</td>
                  <td className="p-2.5 font-mono text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800/60">{formatCurrency(row.paycheck)}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.miles} mi</td>
                  <td className="p-2.5 font-mono text-right text-rose-500 border-r border-slate-100 dark:border-slate-800/60">-{formatCurrency(row.cashAdvance)}</td>
                  <td className="p-2.5 font-mono text-right text-emerald-500 border-r border-slate-100 dark:border-slate-800/60">+{formatCurrency(row.reimbursement)}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">-{formatCurrency(row.trlRent)}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">-{formatCurrency(row.truckRent)}</td>
                  <td className="p-2.5 font-mono text-right text-amber-500 border-r border-slate-100 dark:border-slate-800/60">{formatCurrency(row.fuelCost)}</td>
                  <td className="p-2.5 font-mono text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(row.netPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
