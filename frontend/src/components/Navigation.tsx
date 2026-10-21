'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserRole } from '@/types/logistics';
import { cn } from '@/lib/utils';
import { 
  Truck, 
  ShieldCheck, 
  DollarSign, 
  Users, 
  Radio, 
  LogOut,
  ChevronDown
} from 'lucide-react';

const rbacRoles: UserRole[] = ['ADMIN', 'DISPATCHER', 'SAFETY/TELEMATICS'];

export default function Navigation() {
  const { user, logout, switchRole } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN' || user.role === 'Superadmin';
  const isDispatcher = user.role === 'DISPATCHER' || isAdmin;
  const isSafety = user.role === 'SAFETY/TELEMATICS';
  const isAccounting = user.role === 'Accounting' || isAdmin;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100 select-none">
      <div className="px-4 py-2 flex items-center justify-between gap-4">
        
        {/* Left: Brand & Telemetry Indicator */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-black tracking-tighter text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
              🦥
            </div>
            <div>
              <div className="font-extrabold tracking-wider text-sm flex items-center gap-1.5 text-white">
                <span>SLOTH</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  DISPATCH OS
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-md text-slate-200 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5 text-blue-400" />
              <span>Dispatch Grid</span>
            </Link>

            {(isAdmin || isAccounting) && (
              <Link
                href="/accounting"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accounting</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/users"
                className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Team & RBAC</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Quick Role Switcher, Telemetry Pill, Theme Toggle, User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Live Telemetry Ping Status */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 radar-live-dot" />
            <span>Samsara Telemetry Live</span>
          </div>

          {/* Quick RBAC Role Switcher (Simulate / Test Roles) */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-md p-0.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={user.role}
              onChange={(e) => switchRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-200 text-[11px] font-semibold py-0.5 pr-2 focus:outline-none cursor-pointer"
              title="Quickly test how SLOTH renders for different user roles"
            >
              {rbacRoles.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  Role: {r}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle (Dark / Light) */}
          <ThemeToggle />

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="text-right hidden lg:block">
              <div className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                {user.username}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {user.role}
              </div>
            </div>

            <Link
              href="/login"
              onClick={logout}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
