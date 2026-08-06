import config from "./config.js";
import mongoose from "mongoose";

async function connectDB() {
    if (!config.MONGO_URI) {
        throw new error("MongoDB URI not set. Skipping DB connection.");
        
    }

    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to DB");
}

export default connectDB;