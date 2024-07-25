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
app.use(express.urlencoded({ extended: true }));

import userRouter from "./routes/user.routes.js";
import threadRouter from "./routes/thread.routes.js";
import postRouter from "./routes/post.routes.js";
import commentRouter from "./routes/comment.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/threads", threadRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);

app.get("/", (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { message: "Api working" }, "Api working"));
});

export { app };
