// import { json } from "express";
import userModel from "../models/user.model.js";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import config from "../config/config.js";

 export async function register(req, res) {
    
    const { username, email, password} = req.body;

    const isAlreadyRegistered = await userModel.findOne({
        $or:[
            { username },
            { email }
        ]
    })
    
    if(isAlreadyRegistered){
       return res.status(409).json({
            message: "Username or email already exist"
        })
    }

    //converting  password into bycrpt form
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    })
     
    //we Create a token 
    const token = jwt.sign({
        id: user._id
    }, config.JWT_SECRET,
    {
        expiresIn: "1d"
    }
)

    res.status(201).json({
        message: "User registered successfully",
        user:{
            username: user.username,
            email: user.email
        },
        token
    })
}