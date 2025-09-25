import React from 'react';

// The onToggleView prop is a function passed from the parent component
// that allows us to switch the view between login and sign-up.
interface HomePageProps {
  onToggleView: (showLogin: boolean) => void;
}

const HomePage = ({ onToggleView }: HomePageProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-2xl p-8 space-y-8 bg-white rounded-xl shadow-2xl text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
          Welcome to the Clinical Trial Screener
        </h1>
        <p className="text-lg text-gray-600">
          Sign up to get started or log in to continue your work.
        </p>
      </div>
    </div>
  );
};

export default HomePage;