import {
  ListUser,
  CreateUser,
  login,
  updateUsers,
  deleteUsers,
  VerifyAccountService,
  authUrl,
  Oauth2Client,
  getUsers,
  getEmails,
} from "../service/User.Service.js";
import { findUserById, createUsers } from "../repository/User.Repository.js";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
// ==============
// Mengambil semua user
// ==============
export const allusers = async (req, res) => {
  try {
    const user = await ListUser();

    res.status(200).json({
      success: true,
      message: "Success to Get all users",
      data: user,
    });
  } catch (error) {
    console.error("error get users");
    res.status(404).json({
      success: false,
      message: "Failed to Get all users",
      error: error.message,
    });
  }
};

// ===========
// create user / registrasi user
// ===========
export const createuser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const user = await CreateUser(name, email, password, phone);

    res.status(201).json({
      // Gunakan 201 untuk Created
      success: true,
      message: "Registrasi berhasil. Silakan cek email.",
      data: {
        // Jangan kembalikan password/token ke frontend!
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({
      // Gunakan 400 untuk Bad Request
      success: false,
      message: error.message,
    });
  }
};

// ===========
// verify email
// ===========
export const VerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    await VerifyAccountService(token);

    // Redirect ke frontend dengan status sukses
    res.redirect("http://localhost:3000/user/verify?status=success");
  } catch (error) {
    // Redirect ke frontend dengan status error
    res.redirect(
      `http://localhost:3000/user/verify?status=error&message=${encodeURIComponent(
        error.message
      )}`
    );
  }
};
// ================
// Login
// ================

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi",
      });
    }

    const user = await login(email, password);

    res.status(200).json({
      success: true,
      message: "Berhasil Login",
      data: user,
    });
  } catch (error) {
    console.error("error login:", error.message);
    res.status(401).json({
      success: false,
      message: "Gagal Login",
      error: error.message,
    });
  }
};

// ==============
// login menggunakan Oauth
// ==============
export const loginAuth = async (req, res) => {
  res.redirect(authUrl);
};

export const loginCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.redirect("http://localhost:3000/login?error=no_code");
    }

    // 1. Get tokens from Google using authorization code
    const { tokens } = await Oauth2Client.getToken(code);
    Oauth2Client.setCredentials(tokens);

    // 2. Get user info from Google
    const oauth2 = google.oauth2({
      auth: Oauth2Client,
      version: "v2", // lowercase v2
    });

    const { data: userInfo } = await oauth2.userinfo.get(); // lowercase userinfo

    if (!userInfo || !userInfo.email) {
      return res.redirect("http://localhost:3000/login?error=no_user_info");
    }

    // 3. Check if user already exists in database
    let existingUser = await getEmails(userInfo.email);
    let userData;

    if (existingUser) {
      // User sudah ada, langsung gunakan data yang ada
      userData = existingUser;
    } else {
      // User baru, buat akun baru
      userData = await createUsers({
        name: userInfo.name || userInfo.email.split("@")[0],
        email: userInfo.email,
        password: "", // OAuth tidak perlu password
        phone: `google_${Date.now()}`, // Generate unique phone
        is_verified: true, // OAuth user langsung verified
      });
    }

    // 4. Generate JWT token
    const payload = {
      id: userData.id,
      email: userData.email,
      role: userData.role || "user",
    };

    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // 5. Redirect ke frontend dengan token
    return res.redirect(`http://localhost:3000/?token=${jwtToken}`);
  } catch (error) {
    console.error("OAuth Error:", error.message);
    console.error(error.stack);
    return res.redirect("http://localhost:3000/login?error=oauth_failed");
  }
};

// ==============
// update user
// ==============
export const editUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, password } = req.body;

    if (!id) {
      return res.status(404).json({
        message: "id tidak ditemukan",
      });
    }

    if (!email || !name || !password) {
      return res.status(404).json({
        message: "Email, Name, Password tidak ditemukan",
      });
    }

    const user = await updateUsers(id, email, name, password);

    res.status(200).json({
      success: true,
      message: "berhasil edit data user",
      data: user,
    });
  } catch (error) {
    console.error("error edit", error.message);
    res.status(500).json({
      success: false,
      message: "gagal mengupdate data user",
      error: error.message,
    });
  }
};

// ===========
// delete user
// ===========
export const userDelete = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        message: "id tidak ditemukan",
      });
    }

    const user = await deleteUsers(id);
    res.status(200).json({
      success: true,
      message: "berhasil menghapus",
      data: user,
    });
  } catch (error) {
    console.error("error delete", error.message);
    res.status(500).json({
      success: false,
      message: "gagal menghapus user",
      error: error.message,
    });
  }
};

// ===========
// get current user (me)
// ===========
export const getMe = async (req, res) => {
  try {
    // Ambil token dari header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil user dari database
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    // Return user data tanpa password
    const { password, verification_token, ...userData } = user;

    res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error getMe:", error.message);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah expired",
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal mengambil data user",
      error: error.message,
    });
  }
};
