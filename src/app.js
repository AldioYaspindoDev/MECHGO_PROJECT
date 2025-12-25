import express, { urlencoded } from "express";
import "dotenv/config";
import routeruser from "./route/User.Routes.js";
import cors from "cors";
import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { getEmail, createUsers } from "./repository/User.Repository.js";

const app = express();

// ===================
// kode google Oauth2
// ===================
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const scopes = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent", // Hanya minta consent sekali, tidak berulang
});

app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

app.use(express.json());
app.use(urlencoded({ extended: true }));

// ===================
// login google
// ===================
app.get("/auth/google", (req, res) => {
  res.redirect(authUrl);
});

// ===================
// kode google Oauth2
// ===================
app.get("/auth/google/callback", async (req, res) => {
  try {
    console.log("=== GOOGLE OAUTH CALLBACK STARTED ===");

    const code = req.query.code;
    console.log("1. Code received:", code ? "YES" : "NO");

    if (!code) {
      console.log("❌ No code provided");
      return res.redirect("http://localhost:3000/login?error=no_code");
    }

    console.log("2. Getting token from Google...");
    const token = await oauth2Client.getToken(code);
    const tokens = token.tokens;
    oauth2Client.setCredentials(tokens);
    console.log("✅ Token received");

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    console.log("3. Getting user info...");
    const userInfo = await oauth2.userinfo.get();
    console.log("✅ User info:", userInfo.data.email);

    if (!userInfo.data) {
      console.log("❌ No user data");
      return res.redirect("http://localhost:3000/login?error=no_user");
    }

    // Cek apakah user sudah ada
    console.log("4. Checking if user exists...");
    let existingUser = await getEmail(userInfo.data.email);

    let userData;

    if (existingUser) {
      console.log("✅ User already exists - logging in");
      userData = existingUser;
    } else {
      console.log("5. Creating new user...");
      userData = await createUsers({
        name: userInfo.data.name,
        email: userInfo.data.email,
        password: "",
        phone: `google_${Date.now()}`, // Generate unique phone untuk menghindari duplicate
        is_verified: true,
      });
      console.log("✅ New user created");
    }

    // Generate JWT token
    console.log("6. Generating JWT...");
    const payload = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("✅ JWT generated");

    // Set cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    console.log("=== REDIRECTING TO HOMEPAGE ===");
    console.log("JWT Token:", jwtToken); // Debug: lihat token yang digenerate
    return res.redirect(`http://localhost:3000/?token=${jwtToken}`);
  } catch (error) {
    console.error("❌ Google OAuth Error:", error.message);
    console.error(error.stack);
    return res.redirect("http://localhost:3000/login?error=oauth_failed");
  }
});

// ===================
// kode user
// ===================
app.use("/user", routeruser);

export default app;
