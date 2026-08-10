import jwt from "jsonwebtoken";
import config from "../config/config.js";

export function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        // Extract decoded JWT payload, which contains { id: user._id }
        req.user = decoded; 
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
}
