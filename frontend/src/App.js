import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import theme from './theme';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeviceManagement from './pages/DeviceManagement';
import VersionManagement from './pages/VersionManagement';
import ScheduleManagement from './pages/ScheduleManagement';
import AuditTrail from './pages/AuditTrail';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import LoadingSkeleton from './components/LoadingSkeleton';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSkeleton type="dashboard" />;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== 'admin' && user.role !== requiredRole) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/devices"
        element={
          <ProtectedRoute>
            <Layout>
              <PageTransition>
                <DeviceManagement />
              </PageTransition>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/versions"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <PageTransition>
                <VersionManagement />
              </PageTransition>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedules"
        element={
          <ProtectedRoute>
            <Layout>
              <PageTransition>
                <ScheduleManagement />
              </PageTransition>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <PageTransition>
                <AuditTrail />
              </PageTransition>
            </Layout>
          </ProtectedRoute>
        }
      />
      
      {/* Redirect any unknown routes to landing page */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;