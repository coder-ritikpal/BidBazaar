import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    firstName: { type: String, required: true },
    lastName:{type:String , required:true },
  },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: false, unique: true },
  password: { type: String, required: function() {
    return !this.googleId; // Password is required if googleId is not present
  } },
},{ timestamps: true});

const userModel = mongoose.model("user", userSchema);

export default userModel;
