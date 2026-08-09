import dotenv from 'dotenv';

dotenv.config();

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URL is not defined in envirnoment variables");
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in envirnoment variables");
}

if(!process.env.GOOGLE_USER){
    throw new Error("GOOGLE_USER is not defined in environment variables");
}
if(!process.env.GOOGLE_APP_PASSWORD){
    throw new Error("GOOGLE_PASSWORD is not defined in environment variables");
}

const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_USER: process.env.GOOGLE_USER,
    GOOGLE_APP_PASSWORD: process.env.GOOGLE_APP_PASSWORD,
};

export default config;