import { Router } from "express";
import * as pitchController from "../controllers/pitch.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const pitchRouter = Router();

// POST /api/pitches
pitchRouter.post("/", authenticate, pitchController.createPitch);

// GET /api/pitches/:pitchId
pitchRouter.get("/:pitchId", authenticate, pitchController.getPitch);

export default pitchRouter;
