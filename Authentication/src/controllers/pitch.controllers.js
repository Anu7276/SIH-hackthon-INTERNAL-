import pitchModel from "../models/pitch.model.js";

export async function createPitch(req, res) {
    try {
        // req.user is set by auth middleware
        const userId = req.user.id;
        const { originalFileName, fileType } = req.body;

        const pitch = await pitchModel.create({
            userId,
            originalFileName,
            fileType,
            status: "pending"
        });

        return res.status(201).json({
            message: "Pitch created successfully",
            pitch: {
                id: pitch._id,
                status: pitch.status,
                createdAt: pitch.createdAt
            }
        });
    } catch (err) {
        console.error("Error creating pitch:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function getPitch(req, res) {
    try {
        const userId = req.user.id;
        const pitchId = req.params.pitchId;

        const pitch = await pitchModel.findOne({
            _id: pitchId,
            userId: userId
        });

        if (!pitch) {
            return res.status(404).json({ message: "Pitch not found" });
        }

        return res.status(200).json({
            message: "Pitch retrieved successfully",
            pitch: {
                id: pitch._id,
                userId: pitch.userId,
                originalFileName: pitch.originalFileName,
                fileType: pitch.fileType,
                status: pitch.status,
                createdAt: pitch.createdAt,
                updatedAt: pitch.updatedAt
            }
        });
    } catch (err) {
        console.error("Error retrieving pitch:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
