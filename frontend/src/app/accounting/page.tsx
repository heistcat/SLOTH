'use client';

import React, { useState } from 'react';
import { mockAccountingData } from '@/lib/mockData';
import { DollarSign, Download, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AccountingPage() {
  const [search, setSearch] = useState('');

  const filtered = mockAccountingData.filter(row => 
    row.load.toLowerCase().includes(search.toLowerCase()) ||
    row.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Accounting Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span>Accounting & Settlement Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Settlement records, driver paychecks, fuel deductions, and equipment rent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search load or status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
            />
          </div>

          <button
            onClick={() => alert('Exporting settlement CSV...')}
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
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">ID</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Load</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80">Status</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Price</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Paycheck</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Mile</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Cash Adv</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Reimb</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">TRL Rent</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Truck Rent</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Fuel</th>
                <th className="p-2.5 border-r border-slate-200/60 dark:border-slate-800/80 text-right">Driver Exp</th>
                <th className="p-2.5 text-right">Deposit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filtered.map(row => (
                <tr 
                  key={row.id} 
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors whitespace-nowrap text-slate-800 dark:text-slate-200"
                >
                  <td className="p-2.5 font-mono text-slate-400 border-r border-slate-100 dark:border-slate-800/60">{row.id}</td>
                  <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800/60">{row.load}</td>
                  <td className="p-2.5 border-r border-slate-100 dark:border-slate-800/60">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/50">
                      {row.status}
                    </span>
                  </td>
                  <td className="p-2.5 font-mono text-right font-medium text-emerald-600 dark:text-emerald-400 border-r border-slate-100 dark:border-slate-800/60">{row.price}</td>
                  <td className="p-2.5 font-mono text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-100 dark:border-slate-800/60">{row.paycheck}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.mile} mi</td>
                  <td className="p-2.5 font-mono text-right text-rose-500 border-r border-slate-100 dark:border-slate-800/60">{row.cashAdvance}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.reimbursement}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.trlRent}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.truckRent}</td>
                  <td className="p-2.5 font-mono text-right text-amber-500 border-r border-slate-100 dark:border-slate-800/60">{row.fuel}</td>
                  <td className="p-2.5 font-mono text-right border-r border-slate-100 dark:border-slate-800/60">{row.driverExpense}</td>
                  <td className="p-2.5 font-mono text-right text-slate-600 dark:text-slate-400">{row.deposit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
