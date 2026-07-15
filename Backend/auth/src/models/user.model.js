import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    firstName: { type: String, required: true },
    lastName:{type:String , required:true },
  },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: false },
  password: { type: String, required: function() {
    return !this.googleId; // Password is required if googleId is not present
  } },
  phoneNumber: { type: String, required: false },
  address: { type: String, required: false },
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipCode: { type: String, required: false },
  country: { type: String, required: false },
  profilePicture: { type: String, required: false },
},{ timestamps: true});

// A partial index only applies the unique constraint to documents that match the filter.
// This ensures that multiple users can be created without a googleId (where it would be null),
// but if a googleId is present, it must be unique.
userSchema.index({ googleId: 1 }, {
  unique: true,
  partialFilterExpression: { googleId: { $type: "string" } }
});

const userModel = mongoose.model("user", userSchema);

export default userModel;
