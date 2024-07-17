import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../config/server.config.js";
import {
    userModel,
    threadModel,
    postModel,
    commentModel,
} from "../models/index.js";

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

export const verifyIfUserExist = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken;
        if (token) {
            const decodedToken = jwt.verify(token, ACCESS_TOKEN_SECRET);
            const user = await userModel.findById(decodedToken?._id);
            req.body.user = user;
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong");
    }
});

export const verifyThread = asyncHandler(async (req, _, next) => {
    try {
        const { threadName } = req.params;
        if (!threadName) {
            throw new ApiError(400, "Thread name cannot be empty");
        }
        const thread = await threadModel.findOne({ name: threadName });
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

        if (thread.createdBy.toString() != user._id.toString()) {
            throw new ApiError(400, "Unauthorised Request");
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request");
    }
});

export const verifyMember = asyncHandler(async (req, _, next) => {
    try {
        const { user, thread } = req.body;
        const newThread = await threadModel.findById(thread._id);

        if (
            !newThread.members.includes(user._id) &&
            thread.createdBy.toString() != user._id.toString()
        ) {
            throw new ApiError(400, "User is not a member.");
        }
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorised Request");
    }
});

export const verifyPost = asyncHandler(async (req, _, next) => {
    try {
        const postId = req.body.postId || req.params.postId;
        const post = await postModel.findById(postId);
        if (!post) {
            throw new ApiError(404, "Post not found");
        }

        req.body.post = post;
        const thread = await threadModel.findById(post.createdFor);
        req.body.thread = thread;
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong");
    }
});

export const verifyComment = asyncHandler(async (req, res, next) => {
    try {
        const { parentCommentId, post } = req.body;
        if (parentCommentId) {
            const comment = await commentModel.findById(parentCommentId);
            if (comment.createdFor.toString() === post._id.toString())
                req.body.parentComment = comment;
        }
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong");
    }
});
