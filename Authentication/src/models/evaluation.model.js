import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema({
    pitchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "pitches",
        required: [true, "pitchId is required"],
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "userId is required"]
    },
    score: {
        type: Number,
        required: [true, "score is required"],
        min: [0, "score cannot be negative"],
        max: [30, "score cannot exceed maxScore of 30"]
    },
    maxScore: {
        type: Number,
        required: [true, "maxScore is required"],
        default: 30
    },
    routing: {
        type: String,
        enum: ["investor_visible", "mentor_routed"],
        required: [true, "routing is required"]
    },
    scoreBreakdown: {
        pitchComponent: { type: Number },
        profileComponent: { type: Number }
    },
    feedback: {
        strengths: [{ type: String }],
        areas_to_improve: [{ type: String }],
        summary_paragraph: { type: String }
    },
    // Compact raw evaluator data: only subtotals and per-criterion scores.
    // Full verbose justifications/flags are deliberately excluded to avoid
    // bloating the document. The full result is returned live to the frontend.
    rawEvaluatorOutputs: {
        pitch: {
            pitch_subtotal: { type: Number },
            scores: { type: mongoose.Schema.Types.Mixed }
        },
        profile: {
            profile_subtotal: { type: Number },
            scores: { type: mongoose.Schema.Types.Mixed }
        }
    }
}, {
    timestamps: true
});

const evaluationModel = mongoose.model("evaluations", evaluationSchema);

export default evaluationModel;
