import React from 'react';
import { 
  X, 
  Stethoscope, 
  Building2, 
  Mail, 
  CheckCircle2, 
  LogOut,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface DoctorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DoctorProfileModal: React.FC<DoctorProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentDoctor, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen || !currentDoctor) return null;

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col font-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft, Dimmed Slate Header */}
        <div className="p-6 bg-[#24344D] text-white relative flex items-start justify-between border-b border-[#334155]">
          <div className="flex items-center gap-4">
            {/* Soft Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-[#334155] border border-slate-500/40 text-slate-100 font-display font-bold text-xl flex items-center justify-center shadow-sm">
              {currentDoctor.avatar_initials}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-lg text-white tracking-tight">
                  {currentDoctor.name}
                </h2>
                <span className="bg-slate-700/80 text-slate-200 text-[10px] font-medium px-2 py-0.5 rounded-full border border-slate-600">
                  {currentDoctor.role}
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5 font-normal">
                {currentDoctor.title}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-300 mt-1 font-mono-data">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  License: {currentDoctor.license_number}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Doctor Details Body (Dimmed Muted Palette) */}
        <div className="p-6 space-y-5">
          {/* Subtle Soft Metrics Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider block">
                Active Cases
              </span>
              <span className="font-display font-semibold text-lg text-[#334155] mt-0.5 block">
                {currentDoctor.active_cases || 12}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider block">
                Clinical Status
              </span>
              <span className="font-display font-medium text-xs text-[#15803D] mt-1.5 inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                On Duty
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
              <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider block">
                Access Level
              </span>
              <span className="font-display font-medium text-xs text-[#475569] mt-1.5 inline-flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#64748B]" />
                Authorized
              </span>
            </div>
          </div>

          {/* Department & Hospital Info */}
          <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] shadow-sm">
                <Building2 size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Hospital Affiliation</p>
                <p className="text-xs font-medium text-[#1E293B]">{currentDoctor.hospital}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] shadow-sm">
                <Stethoscope size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Department & Subspecialty</p>
                <p className="text-xs font-medium text-[#1E293B]">{currentDoctor.department} • {currentDoctor.specialization}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white border border-[#E2E8F0] text-[#64748B] shadow-sm">
                <Mail size={15} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Doctor Clinical Email</p>
                <p className="text-xs font-mono-data text-[#334155] font-medium">{currentDoctor.email}</p>
              </div>
            </div>
          </div>

          {/* Session Security Details */}
          <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <FileCheck size={15} className="text-[#64748B]" />
              <span>Personalized Doctor Workspace</span>
            </div>
            <span className="font-mono-data text-[11px] text-[#475569]">Encrypted ID Session</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#CBD5E1] text-xs font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            Close
          </button>

          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-white border border-[#FECACA] text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors flex items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
