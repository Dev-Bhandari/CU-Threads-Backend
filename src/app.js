import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_ORIGIN } from "./config/server.config.js";

const app = express();

app.use(
    cors({
        origin: CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export { app };
