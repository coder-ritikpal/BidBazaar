import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import useNavigate and Link
import { useThemeStore } from '@/store/themeStore'; // Import useThemeStore from the store index

import { toast } from 'react-toastify'; // Import toast
import axios from 'axios'; // Keep axios for error checking
import { useAuthStore } from '@/store/authStore'; // Import useAuthStore
import { getAuthPageClasses } from '@/styles/auth/authPageStyles';
import { Button, Label, Input } from '@/components/ui'; // Assuming these are from a UI library
import { loginUser, googleAuth } from '@/data/api'; // Import new API functions

const Login = () => {
  const theme = useThemeStore((state) => state.theme);
  const { login } = useAuthStore(); // Get login action from auth store
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isLoading, setIsLoading] = useState(false); // State for loading during form submission
  const [generalError, setGeneralError] = useState(''); // State for general API error message
  const [emailError, setEmailError] = useState(''); // State for email validation error
  const [passwordError, setPasswordError] = useState(''); // State for password validation error
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors on input change
    if (name === 'email' && emailError) setEmailError('');
    if (name === 'password' && passwordError) setPasswordError('');
    if (generalError) setGeneralError('');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');

    if (error === 'google_auth_failed') {
      toast.error('Google authentication failed. Please try again.');
      // Clean up the URL to remove the error parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, document.title, newUrl.toString());
    } else if (error) {
      // Handle other potential errors if needed
      toast.error(`Authentication failed: ${error}`);
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []); // Run only once on component mount

  const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError(''); // Clear previous general errors
    setEmailError('');
    setPasswordError('');

    let isValid = true;

    // Validate Email
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // Validate Password
    if (!formData.password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    if (!isValid) return; // Prevent form submission if any validation fails

    setIsLoading(true); // Start loading

    try {
      const response = await loginUser({
        email: formData.email,
        password: formData.password,
      });
      toast.success('Login successful!'); // Show success toast
      login(response.data.user, response.data.token, 'email'); // Correctly access user and token from response.data
      navigate('/'); // Navigate to home page on successful login
    } catch (error) {
      console.error('Error logging in user:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.data && error.response.data.errors && Array.isArray(error.response.data.errors)) {
            setGeneralError(error.response.data.errors.map(err => err.msg).join(', '));
          } else if (error.response.data && error.response.data.message) {
            setGeneralError(error.response.data.message);
          } else {
            setGeneralError(`Login failed: ${error.response.status} ${error.response.statusText}`);
          }
        } else if (error.request) {
          setGeneralError('Network Error: Could not connect to the server. Please check your connection or try again later.');
        } else {
          setGeneralError(`An unexpected error occurred: ${error.message}`);
          toast.error(`An unexpected error occurred: ${error.message}`); // Show error toast
        }
      } else {
        setGeneralError('An unknown error occurred during login.');
      }
      toast.error(generalError || 'Login failed. Please try again.'); // Show error toast
    } finally {
      setIsLoading(false); // End loading regardless of success or failure
    }
  };


  const {
    inputClasses,
    buttonClasses,
    googleButtonClasses,
    containerClasses,
    headingClasses,
    linkClasses,
    paragraphClasses,
    labelTextClasses,
    separatorTextClasses,
    formLayoutClasses,
    inputGroupClasses,
    passwordInputWrapperClasses,
    passwordToggleButtonClasses,
    separatorContainerClasses,
    separatorLineClasses, // Added separatorLineClasses
    closeButtonClasses,
    backgroundClasses,
    errorMessageClasses, // Added errorMessageClasses
  } = getAuthPageClasses(theme);
  const { appNameHeadingClasses } = getAuthPageClasses(theme); // Reusing logoTextClasses for app name heading

  const handleGoogleLogin = () => { // This will now redirect to dashboard BFF
    googleAuth();
  };

  return (
    <div className={`${backgroundClasses} flex-col`}> {/* Added flex-col to stack items vertically */}
      <div className={containerClasses}> 
        <button
          onClick={() => navigate('/')} 
          className={closeButtonClasses}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className={headingClasses}>Login</h2>
        <form onSubmit={handleSubmit} className={formLayoutClasses}>
          <div className={inputGroupClasses}>
            <Label htmlFor="email" className={labelTextClasses}>Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`${inputClasses} ${emailError ? 'border-red-500' : ''}`}
              required
            />
            {emailError && <p className={errorMessageClasses}>{emailError}</p>}
          </div>
          <div className={inputGroupClasses}>
            <Label htmlFor="password" className={labelTextClasses}>Password</Label>
            <div className={passwordInputWrapperClasses}>
              <Input
                type={showPassword ? 'text' : 'password'} // Toggle type based on state
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`${inputClasses} ${passwordError ? 'border-red-500' : ''}`}
                required
              />
              <button
                type="button" // Important: prevent form submission
                onClick={() => setShowPassword((prev) => !prev)}
                className={passwordToggleButtonClasses}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              > {showPassword ? '🙈' : '👁️'} </button> {/* Eye icon toggle */}
            </div>
            {passwordError && <p className={errorMessageClasses}>{passwordError}</p>}
          </div>
          <div className="text-right">
            <Link to="/forgot-password" className={linkClasses}>
              Forgot Password?
            </Link>
          </div>
          {generalError && <p className={errorMessageClasses}>{generalError}</p>}
          <Button type="submit" className={buttonClasses} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Login'}
          </Button>
          <div className={separatorContainerClasses}>
            <div className={separatorLineClasses}></div>
            <span className={`shrink mx-4 ${separatorTextClasses}`}>Or</span>
            <div className={separatorLineClasses}></div>
          </div>
          <Button
            type="button"
            onClick={handleGoogleLogin}
            className={googleButtonClasses}
          >
            <img src="https://pngimg.com/uploads/google/google_PNG19630.png" alt="Google logo" className="h-5 w-5" />
            Continue with Google {/* googleLogoClasses was not used here, but the img tag is already present */}
          </Button>
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
