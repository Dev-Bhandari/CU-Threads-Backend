import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
} from "../config/server.config.js";
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

export const verifyRefreshToken = asyncHandler(async (req, _, next) => {
    try {
        const { refreshToken } = req.cookies;
        const decodedRefreshToken = jwt.verify(
            refreshToken,
            REFRESH_TOKEN_SECRET
        );
        const user = await userModel.findById(decodedRefreshToken?._id);
        req.body.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) next();
        else throw new ApiError(401, "Invalid Refresh Token");
    }
});

export const verifyCurrUserExist = asyncHandler(async (req, _, next) => {
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

export const verifyUserExist = asyncHandler(async (req, _, next) => {
    try {
        const { username } = req.params;
        if (!username) {
            throw new ApiError(400, "Username name cannot be empty");
        }
        const searchedUser = await userModel.findOne({ username });
        if (!searchedUser) {
            throw new ApiError(404, "User not found");
        }
        req.body.searchedUser = searchedUser;
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

export const verifyThreadCreator = asyncHandler(async (req, _, next) => {
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

export const verifyPostCreator = asyncHandler(async (req, _, next) => {
    try {
        const { user, post } = req.body;

        if (post.createdBy.toString() != user._id.toString()) {
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
        if (!post || post.isDeleted) {
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

export const verifyParentComment = asyncHandler(async (req, res, next) => {
    try {
        const { parentCommentId, post } = req.body;
        if (parentCommentId) {
            const comment = await commentModel.findById(parentCommentId);
            if (!comment) throw new ApiError(404, "Parent comment not found");
            if (comment.content === "[ deleted ]")
                throw new ApiError(400, "Cannot comment on deleted comment");
            if (comment.createdFor.toString() === post._id.toString())
                req.body.parentComment = comment;
        }
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong");
    }
});

export const verifyComment = asyncHandler(async (req, res, next) => {
    try {
        const { commentId } = req.params;

        const comment = await commentModel.findById(commentId);

        if (!comment) throw new ApiError(404, "Comment not found");
        req.body.comment = comment;
        next();
    } catch (error) {
        throw new ApiError(400, error?.message || "Something went wrong");
    }
});
