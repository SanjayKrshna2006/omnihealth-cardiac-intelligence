'use client';

import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Users,
  FileText,
  FlaskConical,
  Heart,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface ClinicalSidebarProps {
  currentRole: UserRole;
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onOpenAiCheckin?: () => void;
  userName?: string;
}

export const ClinicalSidebar: React.FC<ClinicalSidebarProps> = ({
  currentRole,
  activeNav,
  onSelectNav,
  onOpenAiCheckin,
  userName,
}) => {
  const isDoctor = currentRole === 'doctor';
  const displayName = userName || (isDoctor ? 'Dr. Arun Kumar' : 'Rajesh Sharma');
  const roleTitle = isDoctor ? 'Heart Failure Specialist' : 'CAD Cardiac Recovery';
  const initials = isDoctor ? 'AK' : 'RS';

  const navItems = isDoctor
    ? [
        { id: 'dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
        { id: 'patients', label: 'Patient Cohort', icon: Users },
        { id: 'reports', label: 'Clinical Reports', icon: FileText },
        { id: 'engine', label: 'Engine Rules & Limits', icon: FlaskConical },
      ]
    : [
        { id: 'dashboard', label: "Today's Journey", icon: LayoutDashboard },
        { id: 'planner', label: 'Overall Planner', icon: FileText },
        { id: 'changes', label: 'Change Log', icon: Sparkles },
        { id: 'discomfort', label: 'Discomfort Tracker', icon: Heart },
        { id: 'progress', label: 'My Progress & Trends', icon: FlaskConical },
        { id: 'checkin', label: 'Daily AI Check-in', icon: PlusCircle, isAi: true },
        { id: 'wizard', label: 'Plan Setup Wizard', icon: ShieldCheck },
      ];

  return (
    <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col justify-between shrink-0 min-h-screen">
      {/* Top Brand Header */}
      <div>
        <div className="p-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-light border border-accent/20 flex items-center justify-center text-accent">
            <Heart className="w-5 h-5 fill-accent/20" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-foreground text-base tracking-tight">CARELOOP</span>
              <span className="bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                AI
              </span>
            </div>
            <span className="text-[11px] text-muted block leading-tight font-medium">
              Multimodal Cardiac Platform
            </span>
          </div>
        </div>

        {/* Section Header */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between text-[11px] font-bold text-muted uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <span className="text-accent">•</span> CLINICAL WORKSPACE
          </span>
          <span className="text-[10px] text-muted/80 font-mono">v0.1.0</span>
        </div>

        {/* Nav Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'checkin' && onOpenAiCheckin) {
                    onOpenAiCheckin();
                  } else {
                    onSelectNav(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-accent-light text-accent font-bold border-l-4 border-accent rounded-l-none'
                    : 'text-muted hover:text-foreground hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-muted'}`} />
                  <span>{item.label}</span>
                </div>
                {item.isAi ? (
                  <span className="bg-accent text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                    AI
                  </span>
                ) : isActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-accent" />
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile Box matching screenshot exactly */}
      <div className="p-4 border-t border-border space-y-3">
        <div className="bg-surface rounded-xl p-3 border border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-accent-light border border-accent/20 text-accent font-bold text-xs flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-foreground truncate leading-tight">
                {displayName}
              </span>
              <span className="block text-[10px] text-muted truncate leading-tight mt-0.5">
                {roleTitle}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted bg-white px-1.5 py-0.5 rounded border border-border shrink-0">
            710492
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted uppercase font-bold tracking-wider px-1">
          <span>{isDoctor ? 'DOCTOR SESSION' : 'PATIENT SESSION'}</span>
          <span className="flex items-center gap-1 text-status-done font-bold lowercase text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-done inline-block" />
            verified
          </span>
        </div>
      </div>
    </aside>
  );
};
