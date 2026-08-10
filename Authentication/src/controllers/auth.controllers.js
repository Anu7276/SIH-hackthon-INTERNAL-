import userModel from "../models/user.model.js";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../service/email.service.js";
import { generateOtp, getOtpHtml } from "../utils/utils.js";
import otpModel from "../models/otp.model.js";
import mongoose from "mongoose";

// Helper check for MongoDB connection status
function isDbConnected() {
    return mongoose.connection && mongoose.connection.readyState === 1;
}

// In-Memory fallback store when MongoDB is offline
const inMemUsers = new Map(); // id -> user
const inMemOtps = []; // [{ email, user, otpHash }]
const inMemSessions = new Map(); // refreshTokenHash -> session

export async function register(req, res) {
    const { username, email, password } = req.body;

    if (isDbConnected()) {
        try {
            const isAlreadyRegistered = await userModel.findOne({
                $or: [{ username }, { email }]
            });

            if (isAlreadyRegistered) {
                if (!isAlreadyRegistered.verified) {
                    const otp = generateOtp();
                    const html = getOtpHtml(otp);
                    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
                    await otpModel.deleteMany({ email });
                    await otpModel.create({ email, user: isAlreadyRegistered._id, otpHash });
                    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);
                    return res.status(200).json({
                        message: "New OTP sent to email",
                        otp: otp,
                        user: { username: isAlreadyRegistered.username, email: isAlreadyRegistered.email, verified: false }
                    });
                }
                return res.status(409).json({ message: "Email already registered. Please sign in." });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await userModel.create({
                username,
                email,
                password: hashedPassword
            });

            const otp = generateOtp();
            const html = getOtpHtml(otp);
            const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

            await otpModel.create({
                email,
                user: user._id,
                otpHash
            });

            await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);

            return res.status(201).json({
                message: "User registered successfully",
                otp: otp,
                user: {
                    username: user.username,
                    email: user.email,
                    verified: user.verified
                }
            });
        } catch (err) {
            console.error("DB Error in register, falling back to memory:", err.message);
        }
    }

    // In-memory fallback
    for (let u of inMemUsers.values()) {
        if (u.email === email || u.username === username) {
            if (!u.verified) {
                const otp = generateOtp();
                const html = getOtpHtml(otp);
                const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
                const existingIdx = inMemOtps.findIndex(o => o.email === email);
                if (existingIdx !== -1) inMemOtps.splice(existingIdx, 1);
                inMemOtps.push({ email, user: u._id, otpHash });
                await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);
                return res.status(200).json({
                    message: "New OTP sent to email",
                    otp: otp,
                    user: { username: u.username, email: u.email, verified: false }
                });
            }
            return res.status(409).json({ message: "Email already registered. Please sign in." });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = "mem_" + Date.now();
    const user = {
        _id: userId,
        username,
        email,
        password: hashedPassword,
        verified: false
    };
    inMemUsers.set(userId, user);

    const otp = generateOtp();
    const html = getOtpHtml(otp);
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    inMemOtps.push({ email, user: userId, otpHash });
    await sendEmail(email, "OTP Verification", `Your OTP code is ${otp}`, html);

    return res.status(201).json({
        message: "User registered successfully",
        otp: otp,
        user: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    if (isDbConnected()) {
        try {
            const user = await userModel.findOne({ email });

            if (!user) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            if (!user.verified) {
                return res.status(401).json({ message: "Email not verified" });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid email or password" });
            }

            const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "3d" });
            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

            const session = await sessionModel.create({
                user: user._id,
                refreshTokenHash,
                ip: req.ip,
                userAgent: req.headers["user-agent"]
            });

            const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: "15m" });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 3 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                message: "Logged in successfully",
                user: { username: user.username, email: user.email },
                accessToken
            });
        } catch (err) {
            console.error("DB Error in login, falling back to memory:", err.message);
        }
    }

    // In-memory fallback
    let user = null;
    for (let u of inMemUsers.values()) {
        if (u.email === email) {
            user = u;
            break;
        }
    }

    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.verified) {
        return res.status(401).json({ message: "Email not verified" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "3d" });
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const sessionId = "sess_" + Date.now();

    inMemSessions.set(refreshTokenHash, {
        _id: sessionId,
        user: user._id,
        refreshTokenHash,
        revoked: false
    });

    const accessToken = jwt.sign({ id: user._id, sessionId }, config.JWT_SECRET, { expiresIn: "15m" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 3 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        message: "Logged in successfully",
        user: { username: user.username, email: user.email },
        accessToken
    });
}

export async function verifyEmail(req, res) {
    const { otp, email } = req.body;
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    if (isDbConnected()) {
        try {
            const otpDoc = await otpModel.findOne({ email, otpHash });
            if (!otpDoc) {
                return res.status(400).json({ message: "Invalid OTP" });
            }

            const user = await userModel.findByIdAndUpdate(otpDoc.user, { verified: true }, { new: true });
            await otpModel.deleteMany({ user: otpDoc.user });

            const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "3d" });
            const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

            const session = await sessionModel.create({
                user: user._id,
                refreshTokenHash,
                ip: req.ip,
                userAgent: req.headers["user-agent"]
            });

            const accessToken = jwt.sign({ id: user._id, sessionId: session._id }, config.JWT_SECRET, { expiresIn: "15m" });

            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 3 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({
                message: "Email verified successfully",
                user: {
                    username: user.username,
                    email: user.email,
                    verified: user.verified
                },
                accessToken
            });
        } catch (err) {
            console.error("DB Error in verifyEmail, falling back to memory:", err.message);
        }
    }

    // In-memory fallback
    const otpIndex = inMemOtps.findIndex(o => o.email === email && o.otpHash === otpHash);
    if (otpIndex === -1) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    const otpDoc = inMemOtps[otpIndex];
    inMemOtps.splice(otpIndex, 1);

    const user = inMemUsers.get(otpDoc.user);
    if (user) {
        user.verified = true;
    }

    const sessionId = "mem_sess_" + Date.now();
    const refreshToken = jwt.sign({ id: user._id }, config.JWT_SECRET, { expiresIn: "3d" });
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    inMemSessions.set(refreshTokenHash, {
        _id: sessionId,
        user: user._id,
        refreshTokenHash,
        revoked: false
    });

    const accessToken = jwt.sign({ id: user._id, sessionId }, config.JWT_SECRET, { expiresIn: "15m" });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 3 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            username: user ? user.username : 'User',
            email: user ? user.email : email,
            verified: true
        },
        accessToken
    });
}

export async function getMe(req, res) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "token not found" });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);

        if (isDbConnected()) {
            const user = await userModel.findById(decoded.id);
            if (user) {
                return res.status(200).json({
                    message: "user fetched successfully",
                    user: { username: user.username, email: user.email }
                });
            }
        }

        const user = inMemUsers.get(decoded.id);
        if (user) {
            return res.status(200).json({
                message: "user fetched successfully",
                user: { username: user.username, email: user.email }
            });
        }

        return res.status(404).json({ message: "User not found" });
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

export async function refreshToken(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
    }

    try {
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);
        const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

        if (isDbConnected()) {
            const session = await sessionModel.findOne({ refreshTokenHash, revoked: false });
            if (session) {
                const accessToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: "15m" });
                const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: "3d" });
                const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

                session.refreshTokenHash = newRefreshTokenHash;
                await session.save();

                res.cookie("refreshToken", newRefreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    maxAge: 3 * 24 * 60 * 60 * 1000
                });

                return res.status(200).json({ message: "Access token refreshed successfully", accessToken });
            }
        }

        const session = inMemSessions.get(refreshTokenHash);
        if (session && !session.revoked) {
            const accessToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: "15m" });
            const newRefreshToken = jwt.sign({ id: decoded.id }, config.JWT_SECRET, { expiresIn: "3d" });
            const newRefreshTokenHash = crypto.createHash("sha256").update(newRefreshToken).digest("hex");

            inMemSessions.delete(refreshTokenHash);
            session.refreshTokenHash = newRefreshTokenHash;
            inMemSessions.set(newRefreshTokenHash, session);

            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                maxAge: 3 * 24 * 60 * 60 * 1000
            });

            return res.status(200).json({ message: "Access token refreshed successfully", accessToken });
        }

        return res.status(401).json({ message: "Invalid refresh token" });
    } catch (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
}

export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token not found" });
    }

    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    if (isDbConnected()) {
        const session = await sessionModel.findOne({ refreshTokenHash, revoked: false });
        if (session) {
            session.revoked = true;
            await session.save();
        }
    }

    const session = inMemSessions.get(refreshTokenHash);
    if (session) {
        session.revoked = true;
    }

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
}

export async function logoutAll(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token not found" });
    }

    try {
        const decoded = jwt.verify(refreshToken, config.JWT_SECRET);

        if (isDbConnected()) {
            await sessionModel.updateMany({ user: decoded.id, revoked: false }, { revoked: true });
        }

        for (let session of inMemSessions.values()) {
            if (session.user === decoded.id) {
                session.revoked = true;
            }
        }

        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "logged out from all devices successfully" });
    } catch (err) {
        res.clearCookie("refreshToken");
        return res.status(200).json({ message: "logged out from all devices successfully" });
    }
}