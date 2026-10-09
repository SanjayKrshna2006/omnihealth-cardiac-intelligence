'use client';

import React from 'react';
import { ShieldCheck, User, Stethoscope, LogOut, CheckCircle2 } from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface TopRoleNavProps {
  currentRole: UserRole | null;
  currentName?: string;
  onSwitchRole: (role: UserRole) => void;
  onLogout: () => void;
  largeText: boolean;
  onToggleLargeText: () => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
}

export const TopRoleNav: React.FC<TopRoleNavProps> = ({
  currentRole,
  currentName,
  onSwitchRole,
  onLogout,
  largeText,
  onToggleLargeText,
  language,
  onChangeLanguage,
}) => {
  const isDoctor = currentRole === 'doctor';
  const initials = isDoctor ? 'AK' : 'RS';
  const roleSubtitle = isDoctor ? 'Heart Failure & Cardiology Specialist' : 'CAD Recovery • Post-Surgery Patient';

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left Breadcrumb & Stream Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <h2 className="font-semibold text-foreground tracking-tight">
            Clinical Overview & Diagnostic Stream
          </h2>
          <span className="hidden md:inline-block text-xs text-muted border-l border-border pl-2 ml-1">
            CareLoop Adaptive Engine v0.1.0
          </span>
        </div>

        {/* Right Controls: Hospital Pill, Doctor/Patient Badge, Portal Switcher, Logout */}
        <div className="flex items-center gap-3">
          {/* Hospital Network Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-surface border border-border rounded-full text-xs font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>Metropolitan Heart Network</span>
          </div>

          {/* User Badge Pill */}
          <div className="flex items-center gap-2.5 px-3 py-1 bg-surface border border-border rounded-full">
            <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-[11px] font-bold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <span className="block text-xs font-bold text-foreground leading-none">
                {currentName || (isDoctor ? 'Dr. Arun Kumar' : 'Rajesh Sharma')}
              </span>
              <span className="block text-[10px] text-muted leading-tight mt-0.5">
                {roleSubtitle}
              </span>
            </div>
          </div>

          {/* Portal Switcher */}
          <div className="flex bg-surface border border-border p-0.5 rounded-lg text-xs">
            <button
              onClick={() => onSwitchRole('patient')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
                !isDoctor
                  ? 'bg-white text-accent border border-border font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">Patient</span>
            </button>
            <button
              onClick={() => onSwitchRole('doctor')}
              className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-colors ${
                isDoctor
                  ? 'bg-white text-accent border border-border font-semibold shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Stethoscope className="w-3 h-3" />
              <span className="hidden sm:inline">Doctor</span>
            </button>
          </div>

          {/* Text Size Accessibility */}
          <button
            onClick={onToggleLargeText}
            title="Toggle Accessibility Text Size"
            className={`px-2 py-1 rounded-md border text-xs font-bold transition-colors ${
              largeText ? 'bg-accent text-white border-accent' : 'bg-white border-border text-muted hover:text-foreground'
            }`}
          >
            A{largeText ? '+' : ''}
          </button>

          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className="bg-white border border-border text-foreground rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="en">EN</option>
            <option value="hi">हिन्दी</option>
          </select>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            title="Sign out"
            className="p-1.5 text-muted hover:text-foreground rounded-md hover:bg-surface border border-transparent hover:border-border transition-colors flex items-center gap-1 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
