import React, { useState } from 'react';
import useTheme from '../utils/useTheme.js'; // Corrected path
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const Login = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate(); // Initialize useNavigate

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in user:', formData);
    // Add login logic here (e.g., API call)
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  const inputClasses = `w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors duration-300 ${
    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900'
  }`;
  const labelClasses = `block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`;
  const buttonClasses = `w-full py-2 px-4 rounded-md font-semibold transition-colors duration-300 ${
    theme === 'dark' ? 'bg-purple-700 hover:bg-purple-800 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
  }`;
  const googleButtonClasses = `w-full py-2 px-4 rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-300 ${ // Changed to purple theme
    theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
  }`;
  const containerClasses = `relative w-full max-w-md p-8 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`;
  const headingClasses = `text-3xl font-bold text-center mb-6 text-purple-600`;
  const linkClasses = `text-purple-600 hover:underline`;
  const paragraphClasses = `text-center mt-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${theme === 'dark' ? 'bg-linear-to-br from-gray-900 to-purple-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className={containerClasses}> {/* Added 'relative' here */}
        <button
          onClick={() => navigate('/')} // Navigate to home page on close
          className={`absolute top-4 right-4 text-3xl transition-colors duration-300 ${theme === 'dark' ? 'text-white hover:text-purple-500' : 'text-gray-800 hover:text-purple-500'}`}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className={headingClasses}>Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelClasses}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className={labelClasses}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={inputClasses}
              required
            />
          </div>
          <button type="submit" className={buttonClasses}>
            Login
          </button>
          <div className="relative flex items-center py-4">
            <div className="grow border-t border-gray-400"></div>
            <span className={`shrink mx-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Or</span>
            <div className="grow border-t border-gray-400"></div>
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className={googleButtonClasses}
          >
            <img src="https://pngimg.com/uploads/google/google_PNG19630.png" alt="Google logo" className="h-5 w-5" />
            Continue with Google
          </button>
        </form>
        <p className={paragraphClasses}>
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/register')} className={linkClasses}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
