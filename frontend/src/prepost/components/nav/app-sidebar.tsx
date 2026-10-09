'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  Layers,
  Sparkles,
  Heart,
  TrendingUp,
  MessageSquare,
  User,
  LayoutDashboard,
  Users,
  FileText,
  Sliders,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface AppSidebarProps {
  role: UserRole;
  userName: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ role, userName }) => {
  const pathname = usePathname();
  const isDoctor = role === 'doctor';

  interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    isAi?: boolean;
  }

  const patientNavItems: NavItem[] = [
    { href: '/patient/today', label: "Today's Journey", icon: Calendar },
    { href: '/patient/planner', label: 'Overall Planner', icon: Layers },
    { href: '/patient/changes', label: 'Change Log', icon: Sparkles },
    { href: '/patient/discomfort', label: 'Discomfort Tracker', icon: Heart },
    { href: '/patient/progress', label: 'My Progress & Trends', icon: TrendingUp },
    { href: '/patient/checkin', label: 'AI Daily Check-in', icon: MessageSquare, isAi: true },
  ];

  const doctorNavItems: NavItem[] = [
    { href: '/doctor/dashboard', label: 'Clinical Dashboard', icon: LayoutDashboard },
    { href: '/doctor/patients', label: 'Patient Cohort', icon: Users },
    { href: '/doctor/reports', label: 'Clinical Reports', icon: FileText },
    { href: '/doctor/rules', label: 'Engine Rules & Limits', icon: Sliders },
  ];

  const navItems: NavItem[] = isDoctor ? doctorNavItems : patientNavItems;

  return (
    <aside className="w-64 bg-white border-r border-border hidden md:flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Navigation Section */}
        <div className="p-4 border-b border-border">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
            {isDoctor ? 'Physician Portal' : 'Recovery Portal'}
          </span>
        </div>

        {/* Real Links with pathname matching */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/patient/today' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
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
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Status Card */}
      <div className="p-4 border-t border-border">
        <div className="bg-surface rounded-xl p-3 border border-border">
          <span className="block text-xs font-bold text-foreground truncate">{userName}</span>
          <span className="block text-[11px] text-muted truncate mt-0.5 capitalize">
            {isDoctor ? 'Attending Physician' : 'Cardiac Patient'}
          </span>
        </div>
      </div>
    </aside>
  );
};
