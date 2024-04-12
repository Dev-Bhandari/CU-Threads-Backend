import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/server.config.js";
import { userModel, threadModel } from "../models/index.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (!token) {
            throw new ApiError(401, "Unauthorised Request");
        }
        const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
        const user = await userModel.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }
        req.body.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

export const verifyThread = asyncHandler(async (req, _, next) => {
    try {
        const { threadId } = req.body;
        const thread = await threadModel.findById(threadId);
        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }

        req.body.thread = thread;
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong");
    }
});

export const verifyCreater = asyncHandler(async (req, _, next) => {
    try {
        const { user, thread } = req.body;
        if (thread.createdBy.toString() == user._id.toString()) next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request");
    }
});

export const verifyMember = asyncHandler(async (req, _, next) => {
    try {
        const { user, thread } = req.body;
        const newThread = await threadModel.findById(thread._id);

        console.log(newThread);
        if (!newThread.members.includes(user._id)) {
            throw new ApiError(400, "User is not a member.");
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request");
    }
});
