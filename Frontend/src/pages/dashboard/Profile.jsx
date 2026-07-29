import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { User, Phone, MapPin, Edit, Save, X, Mail } from 'lucide-react'; // Added Mail icon
import { getProfileStyles } from '@/styles/dashboard/profileStyles';
import { toast } from 'react-toastify';

const Profile = () => {
  const { user, updateProfile, loading } = useAuthStore();
  const { theme } = useThemeStore();
  const styles = getProfileStyles(theme);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
  });
  const [phoneError, setPhoneError] = useState(''); // State for phone number validation error

  // Fallback data if user is not fully populated
  const userData = user || {};
  const email = userData.email || 'No email provided';

  useEffect(() => {
    // Initialize formData with current user data when component mounts or user data changes
    // Also re-initialize if isEditing state changes to ensure fresh data
    if (userData) {
      setFormData({
        firstName: userData.fullName?.firstName || '', // Use optional chaining for robustness
        lastName: userData.fullName?.lastName || '',   // Use optional chaining for robustness
        phoneNumber: userData.phoneNumber || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || '',
      });
    }
  }, [userData, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Client-side validation for phone number
    if (name === 'phoneNumber') {
      // Allow numbers, spaces, hyphens, parentheses, and an optional leading plus sign
      const phoneRegex = /^\+?[0-9\s\-()]*$/;
      if (value && !phoneRegex.test(value)) {
        setPhoneError('Phone number can only contain numbers, spaces, hyphens, parentheses, and a leading plus sign.');
      } else {
        setPhoneError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Construct the payload for the updateProfile API call
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      // Only send fields that have changed or are part of the form
      // This also ensures empty strings are sent for clearing fields
      // Backend should handle validation for required fields
      // For now, sending all fields in formData

      phoneNumber: formData.phoneNumber,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country,
    };
    try {
      // Prevent submission if there are validation errors
      if (phoneError) {
        toast.error('Please correct the errors before saving.');
        return;
      }
      await updateProfile(payload);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        
        {/* Cover Image */}
        <div className={styles.coverImage}></div>
        
        <div className="px-6 sm:px-10 pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-8">
            {/* Avatar */}
            <div className={styles.avatarContainer}>
              {formData.firstName[0]?.toUpperCase() || 'U'}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  {/* First Name and Last Name inputs moved to the main form below */}
                  {/* This form is now empty and can be removed, or its content moved */}
                  {/* For now, let's just remove this redundant form */}
                </div>
              </form>
            ) : (
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold">{formData.firstName} {formData.lastName}</h1>
                <p className={styles.roleText}>BidBazaar Member</p>
              </div>
            )}

            {/* Edit/Save/Cancel Buttons - These will now control the single form below */}
            <div className="mt-6 sm:mt-0 flex-shrink-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <button type="submit" form="profile-form" className={styles.saveButton} disabled={loading || !!phoneError}> {/* Disable if loading or phoneError exists */}
                    {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </button>
                  <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Details Grid - All editable fields are now within this single form */}
          <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Added id="profile-form" */}
            {/* Personal Information */}
            <div className={styles.sectionCard}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-purple-500" />
                Personal Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={styles.label}>First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={styles.nameInput}
                      placeholder="First Name"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{formData.firstName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className={styles.label}>Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={styles.nameInput}
                      placeholder="Last Name"
                    />
                  ) : (
                    <p className="text-base font-medium mt-1">{formData.lastName || 'Not provided'}</p>
                  )}
                </div>
                <div>
                  <label className={styles.label}>Email</label>
                  <p className="text-base font-medium mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
                    {email || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
            {/* Contact Information */}
            <div className={styles.sectionCard}>
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Phone className="w-5 h-5 mr-2 text-purple-500" />
                Contact Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={styles.label}>Phone</label>
                  {isEditing ? (
                    <> {/* Wrap input and error message in a Fragment */}
                      <input // Changed type to "tel" for phone numbers
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className={styles.nameInput} // Reusing nameInput style, adjust if needed
                        placeholder="Phone Number"
                      />
                      {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
                    </>
                  ) : (
                    <p className="text-base font-medium mt-1 flex items-center">
                      {formData.phoneNumber || 'No phone number provided'}
                    </p>
                  )}
                </div>
                <div>
                  <label className={styles.label}>Address</label>
                  {isEditing ? (
                    <>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className={styles.nameInput}
                        placeholder="Street Address"
                      />
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={styles.nameInput}
                        placeholder="City"
                      />
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={styles.nameInput}
                        placeholder="State/Province"
                      />
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className={styles.nameInput}
                        placeholder="Zip/Postal Code"
                      />
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className={styles.nameInput}
                        placeholder="Country"
                      />
                    </>
                  ) : (
                    <p className="text-base font-medium mt-1 flex items-start">
                      <MapPin className="w-4 h-4 mr-1 mt-1 text-gray-400 shrink-0" />
                      {formData.address && `${formData.address}, `}
                      {formData.city && `${formData.city}, `}
                      {formData.state && `${formData.state}, `}
                      {formData.zipCode && `${formData.zipCode}`}
                      {formData.country && `, ${formData.country}` || 'No address provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;