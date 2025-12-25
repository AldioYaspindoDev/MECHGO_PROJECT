import express from "express";
import {
  allusers,
  createuser,
  editUser,
  loginController,
  userDelete,
  VerifyEmail,
  getMe,
  loginAuth,
  loginCallback
} from "../controller/User.Controller.js";

const routeruser = express.Router();

// ==========
// route ambil semua user
// ==========
routeruser.get("/", allusers);

// =============
// membuat user / registrasi
// =============
routeruser.post("/", createuser);

// ==========
// login
// ==========
routeruser.post("/login", loginController);

// ==========
// get current user
// ==========
routeruser.get("/me", getMe);

// ========
// verifikasi email users
// ========
routeruser.get("/verify", VerifyEmail);

// =========
// update user
// =========
routeruser.patch("/edit/:id", editUser);

// ===========
// delete user
// ===========
routeruser.delete("/delete/:id", userDelete);

export default routeruser;
