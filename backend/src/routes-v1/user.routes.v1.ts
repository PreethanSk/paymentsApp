import express , {Router} from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {PrismaClient} from "@prisma/client";
import {userSignupZod, userSigninZod, userUpdateZod} from "../utils/zod.utils";
import {JWT_KEY} from "../utils/config.utils";
import cors from "cors";
import {userMiddleware} from "../middlewares/user.middleware";

const app = express();
const userRouter = Router();
const client = new PrismaClient();
const JWT_SECRET = JWT_KEY || "default-value"
app.use(express.json());
app.use(cors())

userRouter.post("/signup", async(req,res) => {
    try{
        const {username, password, email, name} = req.body;
        const zodParse = userSignupZod.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:`zod error ${zodParse.error.errors}`});
            console.log(zodParse.error.errors)
            return
        }
        const userCheck = await client.user.findFirst({where: {username: username}});
        if(userCheck){
            res.status(403).json({message:"user already exists"});
            return
        }
        const passwordHash = await bcrypt.hash(password, 5);
        const create = await client.user.create({data: {username, password: passwordHash, email, name}});
        await client.balance.create({data: {userId: create.id, balance: 5000}});
        res.json({message:"user created successfully!"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`Server crash in user signup endpoint: ${error}`})
    }
})

userRouter.post("/signin", async(req,res) => {
    try{
        const {username, password} = req.body;
        const zodParse = userSigninZod.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:`zod error: ${zodParse.error.errors}`});
            console.log(zodParse.error.errors)
            return
        }
        const userCheck = await client.user.findFirst({where: {username: username}});
        if(!userCheck){
            res.status(403).json({message:"this user does not exist"});
            return
        }
        const passwordDecrypt = await bcrypt.compare(password, userCheck.password);
        if(!passwordDecrypt){
            res.status(403).json({message:"incorrect password"});
            return
        }
        const token = jwt.sign({userId: userCheck.id}, JWT_SECRET);
        res.json({token: token});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`Server crash in user signin endpoint: ${error}`})
    }
})

userRouter.post("/update",userMiddleware, async(req,res) => {
    try{
        //@ts-ignore
        const userId = req.userId;
        const {name, email } = req.body;
        const zodParse = userUpdateZod.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({message:`zod error: ${zodParse.error.errors}`});
            return
        }
        await client.user.update({where: {id: userId}, data: {name, email}});
        res.json({message:"successfully updated"})
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`Server crash in bulk get endpoint: ${error}`})
    }
} )



userRouter.get("/bulk",async(req,res) => {
    try{
        const filter = req.query.filter as string || "";

        const users = await client.user.findMany({
            where: {
                OR: [
                    {
                        name: {
                            contains: filter,
                            mode: 'insensitive'
                        }
                    },
                    {
                        username: {
                            contains: filter,
                            mode: 'insensitive'
                        }
                    }
                ]
            },
            select: {
                username: true,
                name: true,
                id: true
            }
        });
        res.json({
            user: users
        });
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`Server crash in bulk get endpoint: ${error}`})
    }
})

export default userRouter