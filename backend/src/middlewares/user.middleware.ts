import express, {Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import {JWT_KEY} from "../utils/config.utils";

const app = express();
const JWT_SECRET = JWT_KEY || "default-key";

export function userMiddleware(req: Request, res: Response, next: NextFunction){
    try{
        const token = req.headers["authorization"];
        if(!token){
            res.status(403).json({message:"please enter a token"});
            return
        }
        const verify = jwt.verify(token, JWT_SECRET);
        if(!verify){
            res.status(403).json({message:"invalid token"})
            return
        }
        //@ts-ignore
        req.userId = verify.userId;
        next()
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`Server crash in userMiddleware : ${error}`})
    }
}