import mongoose from "mongoose";
import pitchModel from "../models/pitch.model.js";
import evaluationModel from "../models/evaluation.model.js";

const MAX_SCORE = 30;
const ROUTING_THRESHOLD = 20; // score >= 20 -> investor_visible; score < 20 -> mentor_routed

/**
 * POST /api/ai/evaluations
 *
 * Receives a final AI evaluation result from Python FastAPI, validates it,
 * enforces the routing decision independently (does NOT trust routing from the
 * client), saves/updates the evaluation in MongoDB, and updates the Pitch status.
 *
 * Secured by JWT via the authenticate middleware. The authenticated userId is
 * used to verify Pitch ownership before writing.
 */
export async function submitEvaluation(req, res) {
    try {
        const userId = req.user.id;
        const {
            pitchId,
            score,
            maxScore,
            scoreBreakdown,
            feedback,
            rawEvaluatorOutputs
        } = req.body;

        // --- Validate required fields ---
        if (!pitchId) {
            return res.status(400).json({ message: "pitchId is required" });
        }

        if (score === undefined || score === null) {
            return res.status(400).json({ message: "score is required" });
        }

        // --- Validate pitchId is a valid ObjectId ---
        if (!mongoose.Types.ObjectId.isValid(pitchId)) {
            return res.status(400).json({ message: "Invalid pitchId format" });
        }

        // --- Validate score is a finite number ---
        if (typeof score !== "number" || !isFinite(score)) {
            return res.status(400).json({ message: "score must be a finite number" });
        }

        // --- Validate score range: 0 <= score <= MAX_SCORE ---
        if (score < 0) {
            return res.status(400).json({
                message: `score cannot be negative (received ${score})`
            });
        }
        if (score > MAX_SCORE) {
            return res.status(400).json({
                message: `score cannot exceed maxScore of ${MAX_SCORE} (received ${score})`
            });
        }

        // --- Validate maxScore matches expected value ---
        if (maxScore !== undefined && maxScore !== MAX_SCORE) {
            return res.status(400).json({
                message: `maxScore must be ${MAX_SCORE} (received ${maxScore})`
            });
        }

        // --- Verify Pitch exists and belongs to the authenticated user ---
        const pitch = await pitchModel.findOne({ _id: pitchId, userId });
        if (!pitch) {
            return res.status(404).json({
                message: "Pitch not found or does not belong to this user"
            });
        }

        // --- Enforce routing decision on the backend (do NOT trust client value) ---
        const routing = score >= ROUTING_THRESHOLD ? "investor_visible" : "mentor_routed";

        // --- Upsert evaluation (one canonical evaluation per Pitch) ---
        const evaluation = await evaluationModel.findOneAndUpdate(
            { pitchId },
            {
                $set: {
                    pitchId,
                    userId,
                    score,
                    maxScore: MAX_SCORE,
                    routing,
                    scoreBreakdown: scoreBreakdown || {},
                    feedback: feedback || {},
                    rawEvaluatorOutputs: rawEvaluatorOutputs || {}
                }
            },
            {
                upsert: true,
                new: true,           // return the updated document
                runValidators: true
            }
        );

        // --- Update Pitch status to reflect routing decision ---
        await pitchModel.findByIdAndUpdate(pitchId, {
            $set: { status: routing }
        });

        console.log(
            `[EvalController] Evaluation saved for pitch ${pitchId}: score=${score}/${MAX_SCORE}, routing=${routing}`
        );

        return res.status(201).json({
            message: "Evaluation saved successfully",
            evaluation: {
                id: evaluation._id,
                pitchId: evaluation.pitchId,
                score: evaluation.score,
                maxScore: evaluation.maxScore,
                routing: evaluation.routing,
                createdAt: evaluation.createdAt,
                updatedAt: evaluation.updatedAt
            }
        });

    } catch (err) {
        // Surface Mongoose validation errors clearly
        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join("; ") });
        }
        console.error("[EvalController] Error saving evaluation:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
