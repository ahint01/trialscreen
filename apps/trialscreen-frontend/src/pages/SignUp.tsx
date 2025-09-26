import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import { LucideIcon, Mail, Lock, User, CheckCircle } from 'lucide-react';

// --- Shared UI Components ---

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ id, type, label, icon: Icon, value, onChange }) => (
  <div className="relative mb-6">
    <Icon className="absolute top-1/2 left-3 transform -translate-y-1/2 w-5 h-5 text-indigo-400" />
    <input
      id={id}
      type={type}
      placeholder={label}
      value={value}
      onChange={onChange}
      required
      className="w-full pl-10 pr-4 py-3 bg-gray-700 text-gray-50 placeholder-gray-400 border border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out shadow-inner"
    />
  </div>
);

// --- Signup Component ---

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState(''); // State kept for form field

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const signupMutation = trpc.authRouter.signup.useMutation({
    onSuccess: () => {
      // Logic to redirect after successful signup
      setSuccess("Account created successfully! Redirecting...");
      setError(null);

      setEmail('');
      setPassword('');
      setUsername('');

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    },
    onError: (err) => {
      setError(err.message || 'An unknown error occurred during signup.');
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    // FIX: Only pass email and password to match the TypeScript definition
    signupMutation.mutate({ email, password });
  };

  return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-8 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
          <h2 className="text-3xl font-extrabold text-white text-center mb-6">Create Your Account</h2>

          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-center p-3 text-sm text-green-400 border border-green-600 rounded-lg bg-green-900/50" role="alert">
              <CheckCircle className="flex-shrink-0 inline w-4 h-4 mr-3" />
              <div>{success}</div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 text-sm text-red-400 border border-red-600 rounded-lg bg-red-900/50" role="alert">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <InputField
              id="username"
              type="text"
              label="Username"
              icon={User}
              // The username field is kept in the form for user input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <InputField
              id="email"
              type="email"
              label="Email Address"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <InputField
              id="password"
              type="password"
              label="Password (min 8 chars)"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="submit"
              // Disabled logic now only checks for required fields in the form
              disabled={signupMutation.isPending || !email || !password || !username}
              className="w-full py-3 mt-4 text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 font-semibold rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-[1.005]"
            >
              {signupMutation.isPending ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition duration-150">
              Log In
            </Link>
          </p>
        </div>
      </div>
  );
};

export default Signup;