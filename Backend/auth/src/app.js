import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import config from "./config/config.js";
import cors from "cors";
import userModel from "./models/user.model.js";
import { publishToQueue } from "./broker/rabbit.js";
import cookieParser from "cookie-parser";

const app = express();


const isTest =
  process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

app.use(
  cors({
    origin: "http://localhost:5173", // Reverted to HTTP
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"], // Explicitly allow Authorization header
  }),
);

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

/* ---------------- SESSION ---------------- */

if (!isTest) {
  // app.use(
  //   session({
  //     secret: config.SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       secure: process.env.NODE_ENV === "production",
  //       httpOnly: true,
  //       sameSite: "lax",
  //       maxAge: 1000 * 60 * 60 * 24 * 7,
  //     },
  //   }),
  // );

  app.use(passport.initialize());
  // app.use(passport.session());
}

/* ---------------- GOOGLE OAUTH ---------------- */

if (!isTest) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.CLIENT_ID,
        clientSecret: config.CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/api/auth/google/callback", // Reverted fallback to HTTP
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await userModel.findOne({
            $or: [{ googleId: profile.id }, { email: profile.emails[0].value }],
          });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              await user.save();
            }

            return done(null, user);
          }

          const newUser = await userModel.create({
            email: profile.emails[0].value,
            googleId: profile.id,
            fullName: {
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
            },
          });

          if (!isTest) {
            await publishToQueue("user_registration", {
              id: newUser._id,
              email: newUser.email,
              fullName: newUser.fullName,
            });
          }

          return done(null, newUser);
        } catch (error) {
          console.error("Error in Google Strategy:", error);
          return done(error, false);
        }
      },
    ),
  );

//   passport.serializeUser((user, done) => {
//     done(null, user._id);
//   });

//   passport.deserializeUser(async (id, done) => {
//     try {
//       const user = await userModel.findById(id);
//       done(null, user);
//     } catch (error) {
//       done(error, false);
//     }
//   });
}

/* ---------------- ROUTES ---------------- */

app.use("/api/auth", authRoutes);

export default app; // Export the Express app directly
