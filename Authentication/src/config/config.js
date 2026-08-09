import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sih_auth";
const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey_sih_2026";
const GOOGLE_USER = process.env.GOOGLE_USER || "";
const GOOGLE_APP_PASSWORD = process.env.GOOGLE_APP_PASSWORD || "";

if (!process.env.GOOGLE_USER || !process.env.GOOGLE_APP_PASSWORD) {
    console.warn("⚠️ Warning: GOOGLE_USER or GOOGLE_APP_PASSWORD missing in .env. OTP will be printed to server console for testing.");
}

const config = {
    MONGO_URI,
    JWT_SECRET,
    GOOGLE_USER,
    GOOGLE_APP_PASSWORD,
    PORT: process.env.PORT || 3000
};

export default config;