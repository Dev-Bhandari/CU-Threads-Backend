import { commentModel, postModel } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { validateCreateComment } from "../utils/validation/comment.validation.js";

const createComment = asyncHandler(async (req, res) => {
    const { user, post, content, parentComment } = req.body;

    const error = validateCreateComment(content);

    if (error) {
        throw new ApiError(400, error.toString());
    }

    const commentObject = {
        createdBy: user._id,
        createdFor: post._id,
        content,
    };

    if (parentComment) {
        commentObject["parentComment"] = parentComment._id;
    }

    const comment = await commentModel.create(commentObject);

    await postModel.findByIdAndUpdate(post._id, {
        $push: { comments: comment._id },
    });

    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment created successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { comment } = req.body;

    const child = await commentModel.findOne({ parentComment: comment._id });
    console.log(child);

    if (child) {
        if (comment.content === "[ deleted ]")
            throw new ApiError(400, "Comment is already deleted");

        comment.content = "[ deleted ]";
        comment.save();
    } else {
        const createdFor = comment.createdFor;
        const commentId = comment._id;
        const deleteRes = await commentModel.deleteOne({ _id: comment._id });
        if (deleteRes.acknowledged) {
            await postModel.findByIdAndUpdate(createdFor, {
                $pull: { comments: commentId },
            });
        }
    }
    res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

const getAllComment = asyncHandler(async (req, res) => {
    const { post } = req.body;
    const matchStage = {
        $match: { createdFor: post._id },
    };

    const lookupUserStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };

    const projectUserInfoStage = {
        $project: {
            "creatorInfo.email": 0,
            "creatorInfo.isVerified": 0,
            "creatorInfo.password": 0,
            "creatorInfo.refreshToken": 0,
            "creatorInfo.createdAt": 0,
            "creatorInfo.updatedAt": 0,
        },
    };

    const sortStage = { $sort: { createdAt: 1 } };

    const pipeline = [
        matchStage,
        lookupUserStage,
        projectUserInfoStage,
        sortStage,
    ];
    const comments = await commentModel.aggregate(pipeline);

    const nestComments = (comments) => {
        const commentMap = {};
        comments.forEach((comment) => {
            comment.replies = [];
            commentMap[comment._id] = comment;
        });

        const nestedComments = [];
        comments.forEach((comment) => {
            if (comment.parentComment) {
                if (commentMap[comment.parentComment]) {
                    commentMap[comment.parentComment].replies.push(comment);
                }
            } else {
                nestedComments.push(comment);
            }
        });

        return nestedComments;
    };

    const nestedComments = nestComments(comments);

    res.status(200).json(
        new ApiResponse(200, nestedComments, "Comments fetched successfully")
    );
});

export { createComment, deleteComment, getAllComment };
