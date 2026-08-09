import mongoose from "mongoose";


const sessionSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        request: [true, "User is required" ]
    },
    refreshTokenHash: {
        type: String,
        require: [true, "Refresh token hash is required" ]
    },
    ip: {
        type: String,
        require: [true, "IP address is required" ]
    },
    userAgent: {
        type: String,
        require: [true, "User Agent is requied" ]
    },
    revoked: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const sessionModel = mongoose.model("sessions", sessionSchema)

export default sessionModel;