import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-xl shadow-2xl text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Welcome to the Clinical Trial Screener
        </h1>
        <p className="text-lg text-gray-600">
          Sign up to get started or log in to continue your work.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/login"
            className="px-6 py-3 text-lg font-medium text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 text-lg font-medium text-gray-700 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;