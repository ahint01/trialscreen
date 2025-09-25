import { useNavigate, useLocation } from 'react-router-dom';

// We'll define a type for the children prop to maintain type safety.
interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    // After logging out, navigate back to the home page
    navigate('/');
  };

  // Determine if the current page is the Home or Login/Signup page
  // We only show the Logout button when authenticated AND not on the home/login page
  const isAuthPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-xl font-bold">Clinical Trials Screener</span>
          <nav>
            {/* ONLY show the Logout button if a token exists AND we are not on the auth pages */}
            {token && !isAuthPage && (
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Logout
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Clinical Trials Screener. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default AppLayout;
