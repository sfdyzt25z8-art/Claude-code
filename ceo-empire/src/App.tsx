import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/auth/LoginPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const BusinessesPage = lazy(() => import('@/pages/BusinessesPage'));
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage'));
const InvestmentsPage = lazy(() => import('@/pages/InvestmentsPage'));
const AchievementsPage = lazy(() => import('@/pages/AchievementsPage'));
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function PageFallback() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Crown className="h-7 w-7 animate-pulse text-gold-500" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/investments" element={<InvestmentsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/statistics" element={<StatisticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
