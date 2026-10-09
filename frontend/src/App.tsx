import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Analysis } from './pages/Analysis';
import { Report } from './pages/Report';
import { PatientsPage } from './pages/PatientsPage';
import { Login } from './pages/Login';
import { PatientPortal } from './pages/PatientPortal';
import { PrePostPage } from './pages/PrePostPage';
import { useAnalysisStore } from './store/analysisStore';
import { checkHealth } from './api/client';

export function App() {
  const { setIsBackendConnected } = useAnalysisStore();

  useEffect(() => {
    const verifyBackend = async () => {
      try {
        const health = await checkHealth();
        setIsBackendConnected(health.status === 'healthy' || health.status === 'ok');
      } catch (err) {
        console.warn('Backend server unreachable:', err);
        setIsBackendConnected(false);
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, [setIsBackendConnected]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Full-screen Login & Patient Portal */}
        <Route path="/login" element={<Login />} />
        <Route path="/patient-portal" element={<PatientPortal />} />

        {/* Clinician Application Workspace */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/analysis/:jobId" element={<Analysis />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/report/:jobId" element={<Report />} />
                <Route path="/report" element={<Report />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/prepost" element={<PrePostPage />} />
                <Route path="/careloop" element={<PrePostPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
