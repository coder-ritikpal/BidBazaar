import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useThemeStore } from '@/store/themeStore'; 
import { toast } from 'react-toastify'; // Import toast
import axios from 'axios'; // Import axios for API interaction
import { useAuthStore } from '@/store/authStore';
import { getAuthPageClasses } from '@/styles/auth/authPageStyles'; // Import the utility function
import { Button, Input, Label, Checkbox} from '@/components/ui';// Assuming these are from a UI library
import { registerUser, googleAuth } from '@/data/api'; // Import new API functions

// API_URL is no longer directly used for auth operations

const Register = () => {
  const theme = useThemeStore((state) => state.theme);
  const { login } = useAuthStore(); // Get login action from auth store
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreeToTerms: false, // New state for checkbox
  });
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [isLoading, setIsLoading] = useState(false); // State for loading during form submission

  const [generalError, setGeneralError] = useState(''); // State for general API error message
  const [firstNameError, setFirstNameError] = useState(''); // State for first name validation error
  const [lastNameError, setLastNameError] = useState(''); // State for last name validation error
  const [emailError, setEmailError] = useState(''); // State for email validation error
  const [passwordError, setPasswordError] = useState(''); // State for password validation error
  const [termsError, setTermsError] = useState(false); // State for validation error
  const navigate = useNavigate(); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'agreeToTerms' && termsError) {
      setGeneralError(''); // Clear general error on input change
      setTermsError(false); // Clear error when checkbox is checked
    }
    if (name === 'email' && emailError) {
      setEmailError(''); // Clear email error when email input changes
    }
    if (name === 'firstName' && firstNameError) {
      setFirstNameError(''); // Clear first name error when input changes
    }
    if (name === 'lastName' && lastNameError) {
      setLastNameError(''); // Clear last name error when input changes
    }
    if (name === 'password' && passwordError) {
      setPasswordError(''); // Clear password error when password input changes
    } else if (generalError) {
      setGeneralError(''); // Clear general error on any input change
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, agreeToTerms: checked }));
    if (checked) {
      setGeneralError(''); // Clear general error on input change
      setTermsError(false); // Clear error when checkbox is checked
    }
  };

   const handleSubmit = async (e) => {
    e.preventDefault();

    setGeneralError(''); // Clear previous general errors
    // Clear all field-specific errors at the start of submission attempt
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setTermsError(false);

    let isValid = true;

    // Validate Terms and Conditions
    if (!formData.agreeToTerms) {
      setTermsError(true);
      isValid = false;
    }

    // Validate First Name
    if (!formData.firstName.trim()) {
      setFirstNameError('First name is required.');
      isValid = false;
    }

    // Validate Last Name
    if (!formData.lastName.trim()) {
      setLastNameError('Last name is required.');
      isValid = false;
    }

    // Validate Email
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    // Validate Password (at least 6 characters long, matching backend)
    if (!formData.password || formData.password.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      isValid = false;
    }
    if (!isValid) return; // Prevent form submission if any validation fails

    setIsLoading(true); // Start loading

    try {
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        fullName: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      });
      console.log('Registration successful:', response.data);
      toast.success('Registration successful!'); // Show success toast
      login(response.data.user, response.data.token, 'email'); // Correctly access user and token from response.data
      navigate('/'); // Navigate to home or login page on successful registration
    } catch (error) {
      console.error('Error registering user:', error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          if (error.response.data && error.response.data.errors && Array.isArray(error.response.data.errors)) {
            // Assuming backend validation errors are in error.response.data.errors
            setGeneralError(error.response.data.errors.map(err => err.msg).join(', '));
          } else if (error.response.data && error.response.data.message) {
            setGeneralError(error.response.data.message);
          } else {
            setGeneralError(`Registration failed: ${error.response.status} ${error.response.statusText}`);
          }
        } else if (error.request) {
          // The request was made but no response was received (e.g., network error, CORS)
          setGeneralError('Network Error: Could not connect to the server. Please check your connection or try again later.');
        } else {
          // Something happened in setting up the request that triggered an Error
          setGeneralError(`An unexpected error occurred: ${error.message}`);
          toast.error(`An unexpected error occurred: ${error.message}`); // Show error toast
        }
      } else {
        setGeneralError('An unknown error occurred during registration.');
      }
      toast.error(generalError || 'Registration failed. Please try again.'); // Show error toast
    }
    finally {
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
    closeButtonClasses,
    backgroundClasses,
    formLayoutClasses, // Added
    inputGroupClasses, // Added
    passwordInputWrapperClasses, // Added
    passwordToggleButtonClasses, // Added
    separatorContainerClasses, // Added
    separatorLineClasses, // Added
    gridContainerClasses, // Added
    checkboxContainerClasses, // Added
    errorMessageClasses, // Added
    googleLogoClasses, // Added
    appNameHeadingClasses,
  } = getAuthPageClasses(theme);

  const handleGoogleRegister = () => {
    googleAuth(); // This will now redirect to dashboard BFF
  };

  return (
    <div className={`${backgroundClasses} flex-col`}> {/* Added flex-col to stack items vertically */}
      <div className={containerClasses}> {/* Added 'relative' here */}
        <button
          onClick={() => navigate('/')} // Navigate to home page on close
          className={closeButtonClasses}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className={headingClasses}>Register</h2>
        <form onSubmit={handleSubmit} className={formLayoutClasses}>
          <div className={gridContainerClasses}>
            <div className={inputGroupClasses}>
              <Label htmlFor="firstName" className={labelTextClasses}>First Name</Label>
              <Input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`${inputClasses} ${firstNameError ? 'border-red-500' : ''}`}
                required
              />
              {firstNameError && <p className={errorMessageClasses}>{firstNameError}</p>}
            </div>
            <div className={inputGroupClasses}>
              <Label htmlFor="lastName" className={labelTextClasses}>Last Name</Label>
              <Input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`${inputClasses} ${lastNameError ? 'border-red-500' : ''}`}
                required
              />
              {lastNameError && <p className={errorMessageClasses}>{lastNameError}</p>}
            </div>
          </div>
          <div className={inputGroupClasses}>
            <Label htmlFor="email" className={labelTextClasses}>Email</Label>
            <Input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={`${inputClasses} ${emailError ? 'border-red-500' : ''}`} required />
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
              <button type="button" onClick={() => setShowPassword((prev) => !prev)}
                className={passwordToggleButtonClasses} // Corrected: Use the class from authPageStyles
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              > {showPassword ? '🙈' : '👁️'} </button>
            </div>
            {passwordError && <p className={errorMessageClasses}>{passwordError}</p>}
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className={checkboxContainerClasses}>
            <Checkbox
              id="agreeToTerms"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onCheckedChange={handleCheckboxChange}
            />
            <Label htmlFor="agreeToTerms" className={labelTextClasses}>
              I agree to the{' '}
              <Link to="/terms-and-conditions" className={linkClasses}>
                Terms and Conditions
              </Link>
            </Label>
          </div>
          {termsError && (
            <p className={errorMessageClasses}>You must agree to the Terms and Conditions.</p>
          )}
          {generalError && (
            <p className={errorMessageClasses}>{generalError}</p>
          )}
          <Button type="submit" className={buttonClasses} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Register'}
          </Button>
          <div className={separatorContainerClasses}>
            <div className={separatorLineClasses}></div>
            <span className={`shrink mx-4 ${separatorTextClasses}`}>Or</span>
            <div className={separatorLineClasses}></div>
          </div>
          <Button
            type="button"
            onClick={handleGoogleRegister}
            className={googleButtonClasses}
          >
            <img src="https://pngimg.com/uploads/google/google_PNG19630.png" alt="Google logo" className={googleLogoClasses} />
            Continue with Google
          </Button>
        </form>
        <p className={paragraphClasses}>
          Already have an account?{' '}
          <button type="button" onClick={() => navigate('/login')} className={linkClasses}>
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
