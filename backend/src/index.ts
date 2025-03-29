import express, {Router} from"express";
import cors from "cors"
import userRouter from "./routes-v1/user.routes.v1";
import accountRouter from "./routes-v1/account.routes.v1";
const app = express();
app.use(express.json());
app.use(cors())

//v1 routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/account", accountRouter)

app.listen(3000);