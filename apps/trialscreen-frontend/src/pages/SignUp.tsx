import React, { useState } from 'react';
import { trpc } from '../utils/trpc';
import { z } from 'zod';
import { TRPCClientError } from '@trpc/client';

// Define the shape of the props for the Signup component
interface SignupProps {
  onSignupSuccess: () => void;
  onToggleView: (showLogin: boolean) => void;
}

// Zod schema for input validation
const signupSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

const Signup = ({ onSignupSuccess, onToggleView }: SignupProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupError, setSignupError] = useState<string | null>(null);

  // Use the tRPC-generated useMutation hook directly.
  const { mutateAsync, status } = trpc.authRouter.signup.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      onSignupSuccess();
    },
    onError: (error) => {
      // Use the TRPCError type for better error handling
      if (error instanceof TRPCClientError) {
        setSignupError(error.message);
      } else {
        setSignupError('An unknown error occurred.');
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    try {
      // Validate inputs with Zod before making the API call
      const credentials = signupSchema.parse({ email, password });
      
      // Call mutateAsync directly on the hook's return value
      await mutateAsync(credentials);

    } catch (e) {
      if (e instanceof z.ZodError) {
        // Fixes TS2339: Property 'errors' does not exist
        // The correct property is 'issues' on a ZodError object
        setSignupError(e.issues[0].message);
      } else if (e instanceof TRPCClientError){
        setSignupError(e.message)
      } else {
        setSignupError('An unexpected error occurred during validation.');
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-sm p-8 space-y-8 bg-white rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-center text-gray-900">Sign Up</h2>
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
          {signupError && <p className="text-red-500 text-sm">{signupError}</p>}
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            disabled={status === 'pending'}
          >
            {status === 'pending' ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => onToggleView(true)} className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none">
            Log in here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
