import { Router } from "express";
import * as authController from "../controllers/auth.controllers.js"

const authRouter = Router();


// PSOT /api/auth/register
authRouter.post("/register", authController.register)

// GET /api/auth/get-me
authRouter.get("/get-me",authController.getMe);


// GET /api/auth/refresh-token
authRouter.get("/refresh-token",authController.refreshToken);

//Get /api/auth/logout
authRouter.get("/logout",authController.logout);

export default authRouter;