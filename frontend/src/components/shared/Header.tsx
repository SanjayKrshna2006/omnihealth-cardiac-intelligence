import React from 'react';
import { Activity, Heart, UploadCloud, FileText, Users, Cpu, Play } from 'lucide-react';
import { useAnalysisStore } from '../../store/analysisStore';
import type { PageType } from '../../store/analysisStore';

export const Header: React.FC = () => {
  const { activePage, setActivePage, isBackendConnected } = useAnalysisStore();

  const navItems: { id: PageType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'upload', label: 'New Assessment', icon: UploadCloud },
    { id: 'analysis', label: 'Live Pipeline', icon: Cpu },
    { id: 'report', label: 'Clinical Report', icon: FileText },
    { id: 'patients', label: 'Patients & History', icon: Users },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActivePage('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-red-500 to-indigo-600 flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform duration-200">
              <Heart className="w-5 h-5 text-white fill-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">OMNI<span className="text-red-500">HEALTH</span></span>
                <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 rounded">v0.1</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Multimodal Cardiac AI Assessment</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* System Status Pill & Action */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-ping' : 'bg-red-400'}`} />
              <span className="text-[11px]">{isBackendConnected ? 'Backend API Active' : 'Offline'}</span>
            </div>

            <button
              onClick={() => setActivePage('upload')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow-md hover:from-red-700 hover:to-rose-700 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start Analysis</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
