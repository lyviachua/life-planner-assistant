import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/Calendar';
import DayPlannerPage from './pages/DayPlanner';
import TasksPage from './pages/Tasks';
import ExpensesPage from './pages/Expenses';
import NotesPage from './pages/Notes';
import PomodoroPage from './pages/Pomodoro';
import SettingsPage from './pages/Settings';
import HelpPage from './pages/Help';
import LoginPage from './pages/Login';
import NotFound from './pages/NotFound';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected Routes wrapped in AppLayout */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/day-planner" element={<DayPlannerPage />} />
                      <Route path="/tasks" element={<TasksPage />} />
                      <Route path="/expenses" element={<ExpensesPage />} />
                      <Route path="/notes" element={<NotesPage />} />
                      <Route path="/pomodoro" element={<PomodoroPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/help" element={<HelpPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;