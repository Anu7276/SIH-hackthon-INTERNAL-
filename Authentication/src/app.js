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

// Direct image routes for portal assets
app.get('/STARTUPAYSH.png', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/STARTUPAYSH.png'));
});
app.get('/dash_main.png', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dash_main.png'));
});

// Serve starting page (Mandala intro + AYUSH Home page) FIRST at root /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/starting page/index.html'));
});

app.use(express.static(path.join(__dirname, '../../Frontend/starting page')));
app.use('/Home_Page', express.static(path.join(__dirname, '../../Frontend/Home_Page')));
app.use('/public', express.static(path.join(__dirname, '../public')));

// Sub-app static routes with fallback to dist index.html
app.use('/profile', express.static(path.join(__dirname, '../../Frontend/profile/dist')));
app.use('/profile', express.static(path.join(__dirname, '../../Frontend/profile')));
app.use('/startups', express.static(path.join(__dirname, '../../Frontend/Startups/dist')));
app.use('/startups', express.static(path.join(__dirname, '../../Frontend/Startups')));
app.use('/Startups', express.static(path.join(__dirname, '../../Frontend/Startups/dist')));
app.use('/schemes', express.static(path.join(__dirname, '../../Frontend/schemes/dist')));
app.use('/schemes', express.static(path.join(__dirname, '../../Frontend/schemes')));

// Authentication Page Route
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Profile App Route
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/profile/dist/index.html'));
});

// Startups App Route
app.get('/startups', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/Startups/dist/index.html'));
});

// Schemes App Route
app.get('/schemes', (req, res) => {
    res.sendFile(path.join(__dirname, '../../Frontend/schemes/dist/index.html'));
});

// Authentication API routes
app.use("/api/auth", authRouter);

// Primary Fallback to starting page index.html
app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../../Frontend/starting page/index.html'));
});

export default app;