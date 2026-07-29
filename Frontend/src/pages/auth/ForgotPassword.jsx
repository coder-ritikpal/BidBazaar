import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useThemeStore } from '@/store/themeStore';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getAuthPageClasses } from '@/styles/auth/authPageStyles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ForgotPassword = () => {
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    inputClasses,
    buttonClasses,
    containerClasses,
    headingClasses,
    linkClasses,
    paragraphClasses,
    labelTextClasses,
    closeButtonClasses,
    backgroundClasses,
    formLayoutClasses,
    inputGroupClasses,
    errorMessageClasses,
    appNameHeadingClasses,
  } = getAuthPageClasses(theme);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
    if (generalError) setGeneralError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setGeneralError('');
    setSuccessMessage('');

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      // This would typically send a request to your backend to send a password reset email
      // For now, it's a placeholder.
      // const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      // console.log(response.data);
      toast.success('If an account with that email exists, a password reset link has been sent.');
      setSuccessMessage('If an account with that email exists, a password reset link has been sent to your email address.');
    } catch (error) {
      console.error('Forgot password error:', error);
      setGeneralError('Failed to send password reset email. Please try again.');
      toast.error('Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${backgroundClasses} flex-col`}>
      <div className={containerClasses}>
        <button
          onClick={() => navigate('/login')}
          className={closeButtonClasses}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className={headingClasses}>Forgot Password</h2>
        <form onSubmit={handleSubmit} className={formLayoutClasses}>
          <div className={inputGroupClasses}>
            <Label htmlFor="email" className={labelTextClasses}>Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={handleChange}
              className={`${inputClasses} ${emailError ? 'border-red-500' : ''}`}
              required
            />
            {emailError && <p className={errorMessageClasses}>{emailError}</p>}
          </div>
          {generalError && <p className={errorMessageClasses}>{generalError}</p>}
          {successMessage && <p className="text-green-500 text-sm mt-1">{successMessage}</p>}
          <Button type="submit" className={buttonClasses} disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
        <p className={paragraphClasses}>
          Remember your password?{' '}
          <button type="button" onClick={() => navigate('/login')} className={linkClasses}>
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;