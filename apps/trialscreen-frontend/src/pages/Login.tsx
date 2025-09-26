import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../utils/trpc'; // Assuming correct relative path: src/pages/Login.tsx -> src/utils/trpc.ts

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Use the tRPC mutation for the login procedure, using the correct 'authRouter' path
  const loginMutation = trpc.authRouter.login.useMutation({
    onSuccess: (data) => {
      // Store the token and navigate to the dashboard
      localStorage.setItem('token', data.access_token);
      // Force a full page reload or state change to trigger App.tsx to see the new token
      navigate('/dashboard');
      window.location.reload(); // Ensures App.tsx re-evaluates isAuthenticated
    },
    onError: (error) => {
      // The error object has a .message property we can access
      setMessage(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    loginMutation.mutate({ email, password });
  };

  return (
    // Center the content on the screen, using dark theme colors
    <div className="flex items-center justify-center min-h-[calc(100vh-6rem)] p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-indigo-700">
        <h2 className="text-3xl font-extrabold text-white text-center">
          Sign In to Your Account
        </h2>
        
        {/* Error Message Display */}
        {message && (
          <div className="p-3 bg-red-600 text-white rounded-lg border border-red-500 text-sm font-medium text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              // Dark theme input styling
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white transition duration-150"
              placeholder="user@example.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // Dark theme input styling
              className="mt-1 block w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white transition duration-150"
              placeholder="••••••••"
            />
          </div>

          {/* Submit Button (Clinical Green Theme) */}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-md text-lg font-bold text-gray-900 bg-green-400 hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-150 transform hover:scale-[1.005]"
          >
            {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        
        {/* Link to Sign Up */}
        <div className="text-sm text-center pt-2">
          {/* Assuming you have a /signup route, adding a link here */}
          <Link to="/signup" className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-150">
            Don't have an account? Sign up here.
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;