import { Router } from "express";
import * as authController from "../controllers/auth.controllers.js"

const authRouter = Router();


// PSOT api/auth/register
authRouter.post("/register", authController.register)

// GET api/auth/get-me
authRouter.post("/get-me",authController.getMe);


export default authRouter;