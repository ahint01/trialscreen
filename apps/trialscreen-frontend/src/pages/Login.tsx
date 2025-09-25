import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '../utils/trpc';
import { z } from 'zod';

// Define the expected shape of the data returned from the backend
interface LoginResult {
  access_token: string;
}

// Define the shape of the props for the Login component
interface LoginProps {
  onLoginSuccess: () => void;
  onToggleView: (showLogin: boolean) => void;
}

// Zod schema for input validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const Login = ({ onLoginSuccess, onToggleView }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (credentials: z.infer<typeof loginSchema>) => {
      // Correctly call the 'login' procedure from the 'authRouter'
      return trpc.authRouter.login.mutate(credentials);
    },
    onSuccess: (data) => {
      // Correctly access the 'access_token' property returned by the backend
      const { access_token } = data as LoginResult;
      localStorage.setItem('token', access_token);
      onLoginSuccess();
    },
    onError: (error: any) => {
      setLoginError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    try {
      // Validate inputs with Zod before making the API call
      loginSchema.parse({ email, password });
      loginMutation.mutate({ email, password });
    } catch (e) {
      if (e instanceof z.ZodError) { // Correctly check for ZodError instance
        setLoginError(e.errors[0].message);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">Log In</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={loginMutation.status === 'pending'}
          >
            {loginMutation.status === 'pending' ? 'Logging In...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => onToggleView(false)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
            Sign up here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;