import express from "express";
import { loginAuth, loginCallback } from "../controller/User.Controller.js";

const AuthRouter = express.Router();    


// =========
// Login Auth 
// =========
AuthRouter.get("/google", loginAuth);

// =========
// login Auth Callback
// =========
AuthRouter.get ("/google/callback", loginCallback);

export default AuthRouter;