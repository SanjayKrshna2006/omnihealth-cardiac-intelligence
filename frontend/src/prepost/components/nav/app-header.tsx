'use client';

import React, { useState } from 'react';
import { Bell, Globe, LogOut, CheckCircle2, User, Stethoscope } from 'lucide-react';
import type { UserRole } from '@/lib/types/database';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  link?: string;
}

interface AppHeaderProps {
  userName: string;
  role: UserRole;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onLogout: () => void;
  unreadNotificationsCount?: number;
  notifications?: NotificationItem[];
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  userName,
  role,
  language,
  onChangeLanguage,
  onLogout,
  unreadNotificationsCount = 0,
  notifications = [],
}) => {
  const isDoctor = role === 'doctor';
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 px-6 py-3">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        {/* Left: User identity & role badge */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
            {isDoctor ? <Stethoscope className="w-4 h-4" /> : <User className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground leading-none">{userName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface border border-border text-muted">
                {isDoctor ? 'Physician' : 'Patient'}
              </span>
            </div>
            <span className="text-[11px] text-muted block mt-0.5">
              {isDoctor ? 'Cardiology & Surgical Care Team' : 'Cardiac Recovery Journey'}
            </span>
          </div>
        </div>

        {/* Right: Notifications Bell, Language Selector, Sign out */}
        <div className="flex items-center gap-3">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-surface border border-border transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-lg p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border mb-2">
                  <span className="font-bold text-foreground">Notifications</span>
                  <span className="text-[10px] text-muted">{unreadNotificationsCount} unread</span>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-muted text-center py-4">No new notifications</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2 rounded-lg border text-left ${
                          n.unread ? 'bg-accent-light/40 border-accent/20' : 'bg-surface border-border'
                        }`}
                      >
                        <p className="font-semibold text-foreground text-xs">{n.title}</p>
                        <p className="text-[11px] text-muted mt-0.5">{n.body}</p>
                        <span className="text-[9px] text-muted block mt-1">{n.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded-xl px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-muted" />
            <select
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
            </select>
          </div>

          {/* Sign Out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-surface border border-border transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
