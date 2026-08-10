import { Router } from "express";
import * as evaluationController from "../controllers/evaluation.controllers.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const evaluationRouter = Router();

// POST /api/ai/evaluations
// Receives final AI evaluation from Python, validates, persists to MongoDB.
evaluationRouter.post("/", authenticate, evaluationController.submitEvaluation);

export default evaluationRouter;
