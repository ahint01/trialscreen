import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TrialPage from './pages/TrialPage';
import HomePage from './pages/HomePage';
import AppLayout from './AppLayout';
import { trpc, trpcClient } from './utils/trpc';

const queryClient = new QueryClient();

const App = () => {
  // Use a state variable to handle authentication status
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <BrowserRouter>
          <AppLayout isAuthenticated={isAuthenticated}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected routes */}
              {isAuthenticated ? (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/trials/:trialId" element={<TrialPage />} />
                </>
              ) : (
                // Redirects unauthenticated users to the login page
                <Route path="*" element={<Navigate to="/login" />} />
              )}
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </trpc.Provider>
    </QueryClientProvider>
  );
};

export default App;