import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import TrialPage from './pages/TrialPage';
import HomePage from './pages/HomePage';
import AppLayout from './AppLayout';
import { trpc, trpcClient } from './utils/trpc';

const queryClient = new QueryClient();

const App = () => {
  // Use a state variable to handle authentication status (Kept for routing logic)
  const isAuthenticated = !!localStorage.getItem('token');

  // Removed handleSignupSuccess as it is no longer passed to Signup.tsx

  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <BrowserRouter>
          {/* FIXED: Removed the isAuthenticated prop since AppLayout now fetches it internally */}
          <AppLayout> 
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              {/* FIXED: Removed the onSignupSuccess prop since Signup.tsx handles redirection internally */}
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              {isAuthenticated ? (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/trials/:trialId" element={<TrialPage />} />
                  {/* Redirect authenticated users who land on public pages back to dashboard */}
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/signup" element={<Navigate to="/dashboard" replace />} />
                </>
              ) : (
                // Redirects unauthenticated users to the login page for any protected route
                <Route path="/dashboard" element={<Navigate to="/login" replace />} />
              )}
              
              {/* Fallback route for unhandled paths */}
              <Route path="*" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/" />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </trpc.Provider>
    </QueryClientProvider>
  );
};

export default App;