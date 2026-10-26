/**
 * User data transformation utilities
 */

export const toUserResponse = (user) => {
  if (!user) return null;
  // Ensure we have a plain object to work with, not a Mongoose doc
  const userObject = user.toObject ? user.toObject() : user;
  return {
    id: userObject._id || userObject.id,
    fullName: {
      firstName: userObject.fullName?.firstName || '',
      lastName: userObject.fullName?.lastName || '',
    },
    email: userObject.email,
    googleId: userObject.googleId || null,
    phoneNumber: userObject.phoneNumber || null,
    address: userObject.address || null,
    city: userObject.city || null,
    state: userObject.state || null,
    zipCode: userObject.zipCode || null,
    country: userObject.country || null,
  };
};

