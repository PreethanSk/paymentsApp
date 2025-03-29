import {z} from "zod";

export const userSignupZod = z.object({
    username: z.string(),
    password: z.string(),
    email: z.string().email(),
    name: z.string()
})

export const userSigninZod = z.object({
    username: z.string(),
    password: z.string()
})

export const userUpdateZod = z.object({
    name: z.string().optional(),
    email: z.string().email().optional()
})

export const transactionZod = z.object({
    receiverId: z.number(),
    amount: z.number(),
    description: z.string().optional()
})