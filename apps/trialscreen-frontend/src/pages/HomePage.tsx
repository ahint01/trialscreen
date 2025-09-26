import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    // The entire page needs to fill the screen (h-full ensures it stretches within AppLayout's flex container)
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="w-full max-w-4xl p-12 space-y-8 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 text-center">
        
        {/* Main Title - Dark Blue/Indigo Theme */}
        <h1 className="text-6xl font-extrabold text-indigo-400 leading-tight tracking-tight">
          AI-Powered Clinical Eligibility Screening
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Securely analyze patient data against trial criteria in real-time to accelerate patient enrollment and optimize research efficiency.
        </p>
        
        <div className="pt-6 flex justify-center space-x-6">
          
          {/* Primary Action: Login (Green tone for clinical/success) */}
          <Link
            to="/login"
            className="px-8 py-4 text-xl font-bold text-gray-900 bg-green-400 rounded-xl shadow-lg hover:bg-green-500 transition duration-300 transform hover:scale-[1.02] border-2 border-green-300"
          >
            Login to Dashboard
          </Link>
          
          {/* Secondary Action: Sign Up (Subtle appearance) */}
          <Link
            to="/signup"
            className="px-8 py-4 text-xl font-medium text-indigo-300 border-2 border-indigo-600 rounded-xl hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.02]"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;