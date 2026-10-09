import React, { useState } from 'react';
import { 
  Grid2x2, 
  PlusCircle, 
  Users, 
  FileText, 
  HeartPulse, 
  ChevronRight, 
  LogOut, 
  Building2, 
  ShieldCheck,
  LayoutGrid,
  SlidersHorizontal
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { DoctorProfileModal } from './DoctorProfileModal';

interface LayoutProps {
  children: React.ReactNode;
}

interface SubNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
  subItems?: SubNavItem[];
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: Grid2x2 },
  { id: 'upload', label: 'New Analysis', path: '/upload', icon: PlusCircle, badge: 'AI' },
  { id: 'patients', label: 'Patients', path: '/patients', icon: Users },
  { id: 'reports', label: 'Reports', path: '/report', icon: FileText },
  { 
    id: 'prepost', 
    label: 'Pre & Post Recovery', 
    path: '/prepost', 
    icon: HeartPulse, 
    badge: 'Pre/Post',
    subItems: [
      { id: 'dashboard', label: 'Clinical Dashboard', path: '/prepost?sub=dashboard', icon: LayoutGrid },
      { id: 'cohort', label: 'Patient Cohort', path: '/prepost?sub=cohort', icon: Users },
      { id: 'reports', label: 'Clinical Reports', path: '/prepost?sub=reports', icon: FileText },
      { id: 'limits', label: 'Engine Rules & Limits', path: '/prepost?sub=limits', icon: SlidersHorizontal },
    ]
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentDoctor, logout } = useAuthStore();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'Clinical Overview & Diagnostic Stream';
    if (path.startsWith('/upload')) return 'New Multimodal Cardiac Assessment';
    if (path.startsWith('/analysis')) return 'Real-Time Multi-Agent Pipeline';
    if (path.startsWith('/report')) return 'Explainable Cardiac Assessment Report';
    if (path.startsWith('/patients')) return 'Patient Directory & Longitudinal Records';
    if (path.startsWith('/prepost') || path.startsWith('/careloop')) return 'Pre & Post-Operative Cardiac Recovery Tracker';
    if (path.startsWith('/research')) return 'Multimodal Research & Ablation Benchmarks';
    return 'Multimodal Cardiac AI Platform';
  };

  const isNavActive = (item: NavItem) => {
    const p = location.pathname;
    if (item.path === '/' && p === '/') return true;
    if (item.path === '/upload' && (p.startsWith('/upload') || p.startsWith('/analysis'))) return true;
    if (item.path === '/report' && p.startsWith('/report')) return true;
    if (item.path === '/patients' && p.startsWith('/patients')) return true;
    if (item.path === '/prepost' && (p.startsWith('/prepost') || p.startsWith('/careloop'))) return true;
    if (item.path === '/research' && p.startsWith('/research')) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex">
      {/* ── Left Sidebar (Elegant Light Blue Medical Theme) ── */}
      <aside className="w-[260px] h-screen fixed top-0 left-0 bg-[#F0F6FC] border-r border-[#CBD5E1] shadow-[1px_0_4px_rgba(0,0,0,0.02)] flex flex-col justify-between z-40 select-none text-[#334155] overflow-y-auto overflow-x-hidden print:hidden">
        
        <div>
          {/* Top Brand & Medical Heart Logo */}
          <div 
            onClick={() => navigate('/')}
            className="p-5 cursor-pointer group border-b border-[#E2E8F0] bg-white/70 backdrop-blur-xs relative"
          >
            <div className="flex items-center gap-3">
              {/* Soft Blue Heart Container */}
              <div className="w-9 h-9 rounded-[10px] bg-[#E0F2FE] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] shadow-2xs group-hover:bg-[#0284C7] group-hover:text-white transition-all duration-300">
                <HeartPulse className="w-5 h-5 transition-transform group-hover:scale-105" />
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-[15px] tracking-[1.5px] uppercase text-[#0F172A]">
                    VITAL CARE
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[#0284C7] text-white font-mono-data font-bold">
                    AI
                  </span>
                </div>
                <p className="font-body text-[10px] text-[#64748B] tracking-normal font-medium">
                  Multimodal Cardiac Platform
                </p>
              </div>
            </div>
          </div>

          {/* Section Label: CLINICAL WORKSPACE */}
          <div className="mt-4 px-5 flex items-center justify-between">
            <span className="font-body text-[10px] font-bold uppercase tracking-[1.2px] text-[#0369A1] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
              CLINICAL WORKSPACE
            </span>
            <span className="text-[9px] font-mono-data text-[#64748B] bg-white px-1.5 py-0.5 rounded-[4px] border border-[#E2E8F0]">
              v0.1.0
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="mt-2 px-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item);

              return (
                <div key={item.id} className="space-y-0.5">
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13px] font-body transition-all duration-150 text-left relative overflow-hidden cursor-pointer ${
                      active
                        ? 'bg-white text-[#0284C7] font-semibold border border-[#BAE6FD] shadow-[0_1px_3px_0_rgba(2,132,199,0.12)]'
                        : 'text-[#475569] hover:bg-white/80 hover:text-[#0284C7] hover:border hover:border-[#E2E8F0]/80'
                    }`}
                  >
                    {/* Left Active Indicator Bar */}
                    {active && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#0284C7] rounded-r-full" />
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-[6px] transition-colors ${
                        active 
                          ? 'bg-[#E0F2FE] text-[#0284C7]' 
                          : 'bg-white/80 border border-[#E2E8F0]/60 text-[#64748B] group-hover:text-[#0284C7] group-hover:bg-[#E0F2FE]'
                      }`}>
                        <Icon size={15} />
                      </div>
                      <span>{item.label}</span>
                    </div>

                    {item.badge && !active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[#E0F2FE] text-[#0369A1] font-mono-data font-bold border border-[#BAE6FD]">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight size={14} className="text-[#0284C7]" />
                    )}
                  </button>

                  {/* Sub-Items list under Pre & Post Recovery */}
                  {item.subItems && active && (
                    <div className="ml-3.5 pl-3 py-1 space-y-1 border-l-2 border-[#BAE6FD] my-1">
                      {item.subItems.map((sub) => {
                        const SubIcon = sub.icon;
                        const searchParamSub = new URLSearchParams(location.search).get('sub') || 'dashboard';
                        const isSubActive = searchParamSub === sub.id;

                        return (
                          <button
                            key={sub.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(sub.path);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-left cursor-pointer ${
                              isSubActive
                                ? 'bg-[#E0F2FE] text-[#0284C7] font-semibold border border-[#BAE6FD] shadow-xs'
                                : 'text-[#64748B] hover:bg-white/80 hover:text-[#0284C7]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <SubIcon size={13.5} className={isSubActive ? 'text-[#0284C7] shrink-0' : 'text-[#94A3B8] shrink-0'} />
                              <span className="truncate">{sub.label}</span>
                            </div>
                            {isSubActive && <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Doctor Profile Card & Security Status */}
        <div className="p-3 border-t border-[#CBD5E1] bg-white/70 backdrop-blur-xs space-y-2">
          {/* Doctor Profile Card */}
          <div 
            onClick={() => setIsProfileModalOpen(true)}
            className="p-3 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0284C7]/50 hover:bg-white hover:shadow-xs transition-all cursor-pointer group"
            title="Click to view full doctor credentials & profile"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-[8px] bg-[#E0F2FE] border border-[#BAE6FD] text-[#0369A1] font-display font-bold text-[12px] flex items-center justify-center shadow-2xs group-hover:bg-[#0284C7] group-hover:text-white transition-colors">
                    {currentDoctor?.avatar_initials || 'SK'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-white" />
                </div>

                <div className="min-w-0">
                  <p 
                    className="text-[12px] font-bold text-[#0F172A] leading-tight truncate group-hover:text-[#0284C7] transition-colors"
                    title={currentDoctor?.name}
                  >
                    {currentDoctor?.name?.split(',')[0] || 'Dr. Attending'}
                  </p>
                  <p className="text-[10px] text-[#0284C7] font-medium leading-tight truncate mt-0.5">
                    {currentDoctor?.role || 'Cardiologist'}
                  </p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                title="Sign Out"
                className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#E11D48] hover:bg-[#FFE4E6] transition-colors shrink-0"
              >
                <LogOut size={14} />
              </button>
            </div>

            {/* Hospital & License Row */}
            <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-[#64748B]">
              <span className="flex items-center gap-1 truncate text-[#64748B] text-[10px] max-w-[130px]" title={currentDoctor?.hospital}>
                <Building2 size={11} className="text-[#94A3B8] shrink-0" />
                <span className="truncate">{currentDoctor?.hospital || 'Heart Institute'}</span>
              </span>
              <span className="font-mono-data text-[9px] font-semibold bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] px-1.5 py-0.5 rounded-[4px] shrink-0">
                {currentDoctor?.license_number?.split('-')[2] || '984210'}
              </span>
            </div>
          </div>

          {/* Secure Session Verified Footer */}
          <div className="px-1.5 pt-0.5 flex items-center justify-between text-[9px] text-[#64748B] font-mono-data uppercase">
            <span>Doctor Session</span>
            <span className="text-[#059669] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Verified
            </span>
          </div>
        </div>
      </aside>

      {/* ── Main Layout (Topbar + Content) ── */}
      <div className="pl-[260px] flex-1 flex flex-col min-h-screen w-full min-w-0 print:pl-0 print:p-0 print:w-full">
        {/* Top Bar (56px Height, Polished Clean Medical Bar) */}
        <header className="h-[56px] bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-6 sticky top-0 z-30 flex items-center justify-between shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] relative print:hidden w-full">
          {/* Living ECG Pulse Line (Flush to top edge, 2px) */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none">
            <svg 
              className="w-full h-[2px]" 
              viewBox="0 0 1200 4" 
              preserveAspectRatio="none"
              fill="none"
            >
              <polyline
                className="animate-ecg-line"
                points="0,2 100,2 110,2 115,0 120,4 125,2 140,2 150,1 160,2 300,2 400,2 410,2 415,0 420,4 425,2 440,2 450,1 460,2 600,2 700,2 710,2 715,0 720,4 725,2 740,2 750,1 760,2 900,2 1000,2 1010,2 1015,0 1020,4 1025,2 1040,2 1050,1 1060,2 1200,2"
                stroke="#0284C7"
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 0 3px rgba(2,132,199,0.5))' }}
              />
            </svg>
          </div>

          {/* Left: Current Page Title with Badge */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#0284C7] shadow-sm" />
            <h1 className="font-display font-semibold text-[15px] text-[#0F172A] tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right: Hospital System Badge & Interactive Physician Profile Button */}
          <div className="flex items-center gap-3">
            {/* Hospital System Badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] text-[#475569] font-medium">
              <ShieldCheck size={13} className="text-[#0284C7]" />
              <span>Metropolitan Heart Network</span>
            </div>

            {/* Doctor Profile Chip (Opens Full Profile Modal on Click) */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full bg-[#F0F9FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] cursor-pointer transition-all shadow-sm group"
              title="Click to view physician profile & credentials"
            >
              <div className="w-7 h-7 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-[11px] font-display font-bold shadow-sm group-hover:scale-105 transition-transform">
                {currentDoctor?.avatar_initials || 'DR'}
              </div>
              <div className="text-left">
                <span className="text-xs font-semibold text-[#0369A1] block leading-tight group-hover:text-[#0284C7]">
                  {currentDoctor?.name?.split(',')[0] || 'Doctor Profile'}
                </span>
                <span className="text-[9px] text-[#64748B] block leading-tight font-medium">
                  {currentDoctor?.role || 'Cardiologist'}
                </span>
              </div>
            </button>
          </div>
        </header>

        {/* Page Content Container */}
        <main className="p-4 md:p-6 lg:p-7 flex-1 bg-[#F8FAFC] w-full min-w-0 mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white box-border">
          {children}
        </main>
      </div>

      {/* Doctor Profile Details Modal */}
      <DoctorProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
      />
    </div>
  );
};
