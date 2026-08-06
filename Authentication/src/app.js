import express from 'express';
import morgan from 'morgan';
import authRouter from './routes/auth.routes.js';
import cookieParser from 'cookie-parser';


const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());


app.use("/api/auth", authRouter);

export default app;