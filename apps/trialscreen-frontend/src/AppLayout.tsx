import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ClipboardList } from 'lucide-react';

// Custom hook to check authentication status
// We check for the presence of the 'token' in localStorage
const useAuthStatus = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

// UPDATED: Removed the required 'isAuthenticated' prop
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get authentication status internally
  const isAuthenticated = useAuthStatus(); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    // After logging out, navigate back to the home page
    navigate('/');
    // Force reload to re-evaluate isAuthenticated status in the App/Router
    window.location.reload(); 
  };

  return (
    // Set global dark background and text color
    <div className="flex flex-col min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-800 p-4 shadow-xl border-b border-indigo-700">
        <div className="container mx-auto flex justify-between items-center">
          
          {/* Logo/Title */}
          <span 
            className="text-2xl font-extrabold text-indigo-400 cursor-pointer" 
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            Clinical Trials Screener
          </span>
          
          <nav className="flex items-center space-x-4">
            {/* Link to Dashboard if authenticated and not on the dashboard */}
            {isAuthenticated && location.pathname !== '/dashboard' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-300 hover:text-indigo-400 font-medium py-2 px-2 transition duration-200 flex items-center"
              >
                <ClipboardList className="w-5 h-5 mr-1" /> Dashboard
              </button>
            )}

            {/* ONLY show the Logout button if authenticated */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-lg transition duration-200 flex items-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            )}
            
            {/* Show Get Started/Login button if not authenticated and on the home page */}
            {!isAuthenticated && location.pathname === '/' && (
                <button
                    onClick={() => navigate('/login')}
                    className="bg-green-400 hover:bg-green-500 text-gray-900 font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200"
                >
                    Get Started
                </button>
            )}

          </nav>
        </div>
      </header>
      {/* Remove default padding from main, allowing children to control layout */}
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-800 text-gray-400 p-4 text-center border-t border-indigo-700 text-sm">
        <div className="container mx-auto">
            <p>&copy; {new Date().getFullYear()} Clinical Trials Screener. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;