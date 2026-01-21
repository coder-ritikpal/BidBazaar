import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const registerUser = async (req, res) => {
  try {
    const { fullName:{firstName, lastName}, email, password } = req.body;

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await userModel.create({
      fullName: {
        firstName,
        lastName,
      },
      email,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { id: newUser._id },
      config.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        fullName: {
          firstName: newUser.fullName.firstName,
          lastName: newUser.fullName.lastName,
        },
        email: newUser.email,
      },
    });

  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export async function googleAuthCallback(req, res) {
  try {
    const user = req.user;

    const isUserAlreadyExists = await userModel.findOne(
      {$or:[{ email: user.emails[0].value },
      {googleId:user.id}] });

    if (isUserAlreadyExists) {
      // If user already exists, generate a JWT and respond
      const token = jwt.sign({ id: isUserAlreadyExists._id }, config.JWT_SECRET, { expiresIn: "2d" });
       res.cookie("token", token);
       return res.status(200).json({
        message: "User logged in successfully",
        user:{
          id: isUserAlreadyExists._id,
          email: isUserAlreadyExists.email,
        }
       })
    }

    // If user doesn't exist, create a new user
    const newUser = await userModel.create({
      email: user.emails[0].value,
      googleId: user.id,
      fullName:{
        firstName: user.name.givenName,
        lastName: user.name.familyName
      }
    });

    const token = jwt.sign({ id: newUser._id }, config.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token);

    return  res.status(201).json({
      message: "User registered successfully",
      user:{
        id: newUser._id,
        email: newUser.email,
        fullName:newUser.fullName 
      }
    });

  } catch (error) {
    console.error("Error in Google auth callback:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}