import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitor } from './pages/LiveMonitor';
import { SoundClassification } from './pages/SoundClassification';
import { NoiseHeatmap } from './pages/NoiseHeatmap';
import { NighttimeScreening } from './pages/NighttimeScreening';
import { IncidentReports } from './pages/IncidentReports';
import { MunicipalAuditReports } from './pages/MunicipalAuditReports';
import { Calibration } from './pages/Calibration';
import { PrivacyCentre } from './pages/PrivacyCentre';
import { SettingsPage } from './pages/SettingsPage';
import { AdminLogin } from './pages/AdminLogin';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Public Citizen Routes — Zero Authentication Needed */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/monitor" element={<LiveMonitor />} />
            <Route path="/classification" element={<SoundClassification />} />
            <Route path="/heatmap" element={<NoiseHeatmap />} />
            <Route path="/calibration" element={<Calibration />} />
            <Route path="/privacy" element={<PrivacyCentre />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Administrator Authentication Route */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Municipal Administrator Routes */}
            {/* A: Incident Reports */}
            <Route
              path="/admin/incidents"
              element={
                <ProtectedAdminRoute>
                  <IncidentReports />
                </ProtectedAdminRoute>
              }
            />
            {/* B: Nighttime Violation Screening */}
            <Route
              path="/admin/night-screening"
              element={
                <ProtectedAdminRoute>
                  <NighttimeScreening />
                </ProtectedAdminRoute>
              }
            />
            {/* C: Municipal Audit Reports */}
            <Route
              path="/admin/audit-reports"
              element={
                <ProtectedAdminRoute>
                  <MunicipalAuditReports />
                </ProtectedAdminRoute>
              }
            />

            {/* Legacy route redirects to protected admin paths */}
            <Route path="/incidents" element={<Navigate to="/admin/incidents" replace />} />
            <Route path="/screening" element={<Navigate to="/admin/night-screening" replace />} />
            <Route path="/audit-reports" element={<Navigate to="/admin/audit-reports" replace />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
