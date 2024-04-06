import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/server.config.js";
import userModel from "../models/user.model.js";
import { threadModel } from "../models/thread.model.js";

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

export const verifyCreater = asyncHandler(async (req, _, next) => {
    try {
        const { user, threadId } = req.body;
        const thread = await threadModel.findById(threadId);
        if (!thread) {
            throw new ApiError(404, "Thread not found");
        }
        const userObject = user.toObject();
        delete userObject.password;
        delete userObject.refreshToken;
        req.body.user = userObject;
        req.body.thread = thread;
        if (thread.createdBy.toString() == user._id.toString()) next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request");
    }
});
