import config from "./config.js";
import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(config.MONGO_URI, {
            serverSelectionTimeoutMS: 10000
        });
        console.log("✅ Connected to primary MongoDB successfully.");
    } catch (err) {
        console.warn(`⚠️ Primary MongoDB connection failed (${err.message}). Starting in-memory database...`);
        try {
            const { MongoMemoryServer } = await import("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log("✅ Connected to zero-setup in-memory MongoDB database successfully!");
        } catch (memErr) {
            console.error("❌ Could not start in-memory database fallback:", memErr.message);
            mongoose.set("bufferCommands", false);
        }
    }
}

export default connectDB;