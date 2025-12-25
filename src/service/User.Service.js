import {
  GetAllUsers,
  createUsers,
  deleteUser,
  findUserById,
  getEmail,
  getPhone,
  updateUser,
  findUserByToken,
  enableUser,
} from "../repository/User.Repository.js";
import argon2 from "argon2";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { google } from "googleapis";
import * as emailSender from "../utils/emailSender.js";

// ==========
// ambil semua user
// ==========
export const ListUser = async () => {
  return await GetAllUsers();
};

// ===========
// create user / registrasi
// ===========
export const CreateUser = async (name, email, password, phone) => {
  // 1. Cek Duplikat (Sama seperti kode Anda)
  const existingEmail = await getEmail(email);
  if (existingEmail) throw new Error("Email sudah terdaftar");

  const exixtingPhone = await getPhone(phone);
  if (exixtingPhone) throw new Error("Nomor Telephone telah terdaftar");

  // 2. Persiapan Data
  const token = crypto.randomBytes(32).toString("hex");
  const hashPassword = await argon2.hash(password);

  // 3. Simpan ke Database DULU
  const newUser = await createUsers({
    name,
    email,
    password: hashPassword,
    verification_token: token, // Pastikan ejaan benar
    phone,
    is_verified: false,
  });

  // Kirim Email SETELAH simpan database (Jangan di-return dulu!)
  try {
    const verificationLink = `http://localhost:5000/user/verify?token=${token}`;
    await emailSender.sendVerificationEmail(email, name, verificationLink);
  } catch (emailError) {
    console.error("Gagal kirim email:", emailError);
    // Opsional: Anda bisa menghapus user yang baru dibuat jika email gagal,
    // atau biarkan saja dan sediakan fitur "Kirim Ulang Email".
  }

  return newUser;
};

// ===========
// verify user
// ===========
export const VerifyAccountService = async (token) => {
  // 1. Cari user berdasarkan token
  const user = await findUserByToken(token);

  if (!user) {
    throw new Error("Token tidak valid atau kadaluwarsa");
  }

  // 2. Update status user jadi aktif
  await enableUser(user.email);

  return true; // Berhasil
};

// =============
// Login
// =============
export const login = async (email, password) => {
  const existingUser = await getEmail(email);
  if (!existingUser) throw new Error("Email tidak ditemukan");

  const isPasswordMatch = await argon2.verify(existingUser.password, password);
  if (!isPasswordMatch) throw new Error("Password salah");

  const token = jwt.sign(
    {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  return {
    user: {
      id: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    },
    token,
  };
};

// ==========
// Auth Login Google
// ==========

export const Oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const scopes = [
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

export const authUrl = Oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent",
});

export const getUsers = async (token) => {
  return await findUserByToken(token);
};

export const getEmails = async (token) => {
  return await getEmail(token);
};
// ===========
// update user
// ===========
export const updateUsers = async (id, email, name, password) => {
  const existingUser = await findUserById(id);
  if (!existingUser) throw new Error("User tidak ditemukan");

  // ==============================
  // kode update yang wajib diingat
  // ==============================
  const updateData = {};
  if (email) updateData.email = email;
  if (name) updateData.name = name;
  if (password) {
    updateData.password = await argon2.hash(password);
  }

  return await updateUser(id, updateData);
};

// ===========
// delete user
// ===========
export const deleteUsers = async (id) => {
  return await deleteUser(id);
};
