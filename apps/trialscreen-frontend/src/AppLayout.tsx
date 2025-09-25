import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/SignUp';

// Define the available pages in our app
type Page = 'home' | 'login' | 'signup' | 'dashboard';

const AppLayout = () => {
  // Use a token state to manage authentication status.
  // We'll initialize it by checking for a token in local storage.
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  // State to track the current page. We'll default to 'home' if no token is found.
  const [currentPage, setCurrentPage] = useState<Page>(token ? 'dashboard' : 'home');

  // Function to handle a successful login, saving the token and redirecting to dashboard.
  const handleLoginSuccess = () => {
    // This is handled by the Login component directly now, so we just redirect.
    setCurrentPage('dashboard');
  };

  // Function to handle logout
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setCurrentPage('home');
  };

  // Function to toggle between Login and Signup pages
  const handleToggleView = (showLogin: boolean) => {
    setCurrentPage(showLogin ? 'login' : 'signup');
  };

  // Main rendering logic based on token and current page
  const renderPage = () => {
    if (token) {
      // If a token exists, the user is authenticated.
      // We'll show a simple dashboard for now, regardless of `currentPage`
      // We will add more robust routing later.
      return <Dashboard />;
    } else {
      // User is not authenticated, show login or signup based on currentPage state.
      switch (currentPage) {
        case 'login':
          return <Login onLoginSuccess={() => setToken(localStorage.getItem('token'))} onToggleView={handleToggleView} />;
        case 'signup':
          return <Signup onSignupSuccess={() => setToken(localStorage.getItem('token'))} onToggleView={handleToggleView} />;
        case 'home':
        default:
          return <HomePage onToggleView={handleToggleView} />;
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-xl font-bold">Clinical Trials</span>
          <nav>
            {token ? (
              <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Logout
              </button>
            ) : (
              <div className="space-x-4">
                <button onClick={() => handleToggleView(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Login
                </button>
                <button onClick={() => handleToggleView(false)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Sign Up
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {renderPage()}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Clinical Trials Screener. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AppLayout;