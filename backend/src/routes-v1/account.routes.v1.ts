import express, {Router} from "express";
import {userMiddleware} from "../middlewares/user.middleware";
import {PrismaClient} from "@prisma/client";
import {transactionZod} from "../utils/zod.utils";
import {util} from "zod";
import jsonStringifyReplacer = util.jsonStringifyReplacer;

const app = express();
const client = new PrismaClient();
const accountRouter = Router();

accountRouter.get("/balance", userMiddleware, async(req,res) => {
    try{
        //@ts-ignore
        const userId = req.userId;
        const balance = await client.balance.findFirst({
            where: {userId: userId}
        });
        if(!balance){
            res.status(403).json({message:"unable to retrive balance of user"});
            return
        }
        const balanceValue = balance.balance
        res.json({balance: balanceValue })
    }
    catch(error){
        console.log(error);
        res.status(403).json({message:`server crashed in balance get endpoint ${error}`})
    }
})

accountRouter.post("/transfer", userMiddleware, async(req,res) => {
    try{
        //@ts-ignore
        const senderId = req.userId;
        const {receiverId, amount, description} = req.body;
        const zodParse = transactionZod.safeParse(req.body);
        if(!zodParse.success){
            res.status(403).json({
                message: `zod error  ${zodParse.error.errors}`
            })
        }

        const checkId = await client.user.findUnique({where: {id: receiverId}});
        if(!checkId){
            res.status(403).json({message:"this user does not exist"});
            return
        }
        const receiverBalanceId = await client.balance.findFirst({where: {userId: receiverId}})

        const senderBalance = await client.balance.findFirst({where: {userId: senderId}});
        // @ts-ignore
        if(senderBalance.balance <= amount ){
            res.status(403).json({message:"you dont have enough balance to make this transaction"});
            return
        }

        const transaction = await client.$transaction([
            client.transfer.create({
                data: {
                    senderId,
                    receiverId,
                    amount,
                    status: "COMPLETED",
                    type: "TRANSFER",
                    description
                }
            }),
            client.balance.update({
                where: {userId: senderId},
                data: {balance: {decrement: amount}}
            }),
            client.balance.update({
                where: {userId: receiverId},
                data: {balance: {increment: amount}}
            })
        ])

        if(!transaction){
            res.status(403).json({message:"transaction failed"});
            return
        }

        const createdTransfer = transaction[0];
        res.json({
            message:"transfer created successfully",
            transactionId: createdTransfer.id,
            amount: createdTransfer.amount,
            status: createdTransfer.status,
            type: createdTransfer.type,
            description: createdTransfer.description
        })

    }
    catch(error){
        console.log(error);
        res.status(500).json({message:`server crashed in transfer endpoint ${error}`})
    }
})



export default accountRouter;