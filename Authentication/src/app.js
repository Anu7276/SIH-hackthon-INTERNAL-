import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cookieParser());

// Serve static frontend files (Starting Page as primary)
app.use(express.static(path.join(__dirname, '../../Frontend/starting page')));
app.use('/Home_Page', express.static(path.join(__dirname, '../../Frontend/Home_Page')));
app.use('/profile', express.static(path.join(__dirname, '../../Frontend/profile')));
app.use('/schemes', express.static(path.join(__dirname, '../../Frontend/schemes')));
app.use('/Startups', express.static(path.join(__dirname, '../../Frontend/Startups')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Authentication API routes
app.use("/api/auth", authRouter);

// Fallback to starting page index.html for main web routes
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../../Frontend/starting page/index.html'));
});

export default app;