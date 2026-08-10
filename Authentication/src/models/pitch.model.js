import mongoose from "mongoose";

const pitchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User is required"]
    },
    originalFileName: {
        type: String,
        required: false
    },
    fileType: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ["pending", "processing", "evaluated", "investor_visible", "mentor_routed", "failed"],
        default: "pending"
    }
}, {
    timestamps: true
});

const pitchModel = mongoose.model("pitches", pitchSchema);

export default pitchModel;
