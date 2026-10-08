import mongoose from "mongoose";

const authCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  token: { type: String, required: true },
  user: { type: Object, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // Auto-delete document after this time
});

export default mongoose.model("authCode", authCodeSchema);
