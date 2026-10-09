import axios from 'axios';
import type { OmniHealthState, OmniHealthReport, Patient } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
});

export interface AnalysisJob {
  job_id: string;
  patient_id?: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  stage?: string;
  report_id?: string;
  result?: OmniHealthState;
  error?: string;
}

export const runAnalysis = async (formData: FormData): Promise<{ job_id: string; patient_id: string }> => {
  const res = await apiClient.post('/api/analysis/run', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const runDemoAnalysis = async (patientId: string = 'DEMO-PATIENT-01'): Promise<{ job_id: string; patient_id: string }> => {
  const res = await apiClient.post(`/api/analysis/demo?patient_id=${encodeURIComponent(patientId)}`);
  return res.data;
};

export const getJobStatus = async (jobId: string): Promise<AnalysisJob> => {
  const res = await apiClient.get(`/api/analysis/${jobId}/status`);
  return res.data;
};

export const getReport = async (reportId: string): Promise<OmniHealthReport> => {
  const res = await apiClient.get(`/api/reports/${reportId}`);
  return res.data;
};

export const listPatients = async (doctorEmail?: string, doctorId?: string): Promise<Patient[]> => {
  const params = new URLSearchParams();
  if (doctorEmail) params.append('doctor_email', doctorEmail);
  if (doctorId) params.append('doctor_id', doctorId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await apiClient.get(`/api/patients/${qs}`);
  return res.data;
};

export const getPatientReports = async (patientId: string): Promise<OmniHealthReport[]> => {
  const res = await apiClient.get(`/api/patients/${patientId}/reports`);
  return res.data;
};

export const deletePatient = async (patientId: string): Promise<{ status: string; message: string; deleted_reports_count: number }> => {
  const res = await apiClient.delete(`/api/patients/${encodeURIComponent(patientId)}`);
  return res.data;
};

export const checkHealth = async (): Promise<{ status: string; service: string }> => {
  const res = await apiClient.get('/health');
  return res.data;
};
