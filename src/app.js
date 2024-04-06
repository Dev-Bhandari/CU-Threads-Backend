import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import ApiResponse from "./utils/ApiResponse.js";

const app = express();

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

import userRouter from "./routes/user.routes.js";
import threadRouter from "./routes/thread.routes.js";
import upload from "./middlewares/multer.middleware.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/threads", threadRouter);

app.get("/", (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { message: "Api working" }, "Api working"));
});

export { app };
