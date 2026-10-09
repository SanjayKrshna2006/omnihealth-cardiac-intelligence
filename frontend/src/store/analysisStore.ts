import { create } from 'zustand';
import type { OmniHealthState, OmniHealthReport } from '../types';

export type PageType = 'dashboard' | 'upload' | 'analysis' | 'report' | 'patients' | 'research';

interface AnalysisStore {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  activePatientId: string;
  setActivePatientId: (id: string) => void;
  currentJobId: string | null;
  setCurrentJobId: (jobId: string | null) => void;
  currentState: OmniHealthState | null;
  setCurrentState: (state: OmniHealthState | null) => void;
  currentReport: OmniHealthReport | null;
  setCurrentReport: (report: OmniHealthReport | null) => void;
  recentReports: OmniHealthReport[];
  addRecentReport: (report: OmniHealthReport) => void;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set) => ({
  activePage: 'dashboard',
  setActivePage: (page) => set({ activePage: page }),
  activePatientId: 'PT-10482',
  setActivePatientId: (id) => set({ activePatientId: id }),
  currentJobId: null,
  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),
  currentState: null,
  setCurrentState: (state) => set({ currentState: state }),
  currentReport: null,
  setCurrentReport: (report) => set({ currentReport: report }),
  recentReports: [],
  addRecentReport: (report) =>
    set((prev) => ({
      recentReports: [report, ...prev.recentReports.filter((r) => r.report_id !== report.report_id)].slice(0, 10),
    })),
  isBackendConnected: true,
  setIsBackendConnected: (connected) => set({ isBackendConnected: connected }),
}));
