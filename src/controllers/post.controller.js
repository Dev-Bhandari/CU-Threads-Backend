import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { postModel } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { validateCreatePost } from "../utils/validation/post.validation.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const createPost = asyncHandler(async (req, res) => {
    const { user, thread, title, textContent, tags } = req.body;
    const error = validateCreatePost(title, textContent);

    if (error) {
        throw new ApiError(400, error.toString());
    }

    let mediaArray, mediaUrl, mediaType;
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        if (req.files[0].mimetype.includes("image")) {
            req.files.forEach((file) => {
                if (!file.mimetype.includes("image"))
                    throw new ApiError(
                        400,
                        "Cannot upload image and video together"
                    );
            });
        } else if (req.files[0].mimetype.includes("video")) {
            if (req.files.length > 1)
                throw new ApiError(
                    400,
                    "Cannot upload more than 1 video in a post"
                );
        } else {
            throw new ApiError(400, "File type not supported");
        }
        const mediaArrayPromise = await req.files.map(async (file) => {
            let media;
            try {
                const mediaLocalPath = file.path;
                media = await uploadOnCloudinary(mediaLocalPath);
            } catch (error) {
                console.error(
                    `Error uploading file ${file.filename}: ${error.message}`
                );
            }
            return media;
        });

        mediaArray = await Promise.all(mediaArrayPromise);
        mediaType = mediaArray[0]?.resource_type;
        mediaUrl = mediaArray.map((media) => {
            return media.secure_url;
        });
    }
    const post = await postModel.create({
        createdBy: user,
        createdFor: thread,
        title,
        textContent,
        mediaUrl,
        mediaType,
        tags,
    });
    const postObject = post.toObject();
    delete postObject.createdBy.password;
    delete postObject.createdBy.refreshToken;
    delete postObject.createdFor.members;

    return res
        .status(200)
        .json(new ApiResponse(200, postObject, "Post created successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
    const { post } = req.body;
    post.isDeleted = true;
    post.save();
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Post deleted successfully"));
});

const createUpVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const upVoted = post.upVotes.includes(user._id);
    const downVoted = post.downVotes.includes(user._id);

    if (upVoted) {
        throw new ApiError(400, "Already upvoted");
    }
    await postModel.findByIdAndUpdate(post._id, {
        $pull: { downVotes: user._id },
    });
    const newPost = await postModel.findByIdAndUpdate(
        post._id,
        {
            $push: { upVotes: user },
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVotes: newPost.upVotes.length - newPost.downVotes.length,
            },
            "Upvoted successfully"
        )
    );
});

const deleteUpVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const upVoted = post.upVotes.includes(user._id);

    if (!upVoted) {
        throw new ApiError(400, "Upvoted does not exist");
    }
    const newPost = await postModel.findByIdAndUpdate(
        post._id,
        {
            $pull: { upVotes: user._id },
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVotes: newPost.upVotes.length - newPost.downVotes.length,
            },
            "Upvote removed successfully"
        )
    );
});

const createDownVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const upVoted = post.upVotes.includes(user._id);
    const downVoted = post.downVotes.includes(user._id);

    if (downVoted) {
        throw new ApiError(400, "Already downvoted");
    }
    await postModel.findByIdAndUpdate(post._id, {
        $pull: { upVotes: user._id },
    });
    const newPost = await postModel.findByIdAndUpdate(
        post._id,
        {
            $push: { downVotes: user },
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVotes: newPost.upVotes.length - newPost.downVotes.length,
            },
            "Downvoted successfully"
        )
    );
});

const deleteDownVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const downVoted = post.downVotes.includes(user._id);

    if (!downVoted) {
        throw new ApiError(400, "Downvoted does not exist");
    }
    const newPost = await postModel.findByIdAndUpdate(
        post._id,
        {
            $pull: { downVotes: user._id },
        },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVotes: newPost.upVotes.length - newPost.downVotes.length,
            },
            "Downvote removed successfully"
        )
    );
});

const getPost = asyncHandler(async (req, res) => {
    const { user } = req.body;
    let { post } = req.body;

    const matchStage = { $match: { _id: post._id, isDeleted: false } };

    const lookupThreadStage = {
        $lookup: {
            from: "threads",
            localField: "createdFor",
            foreignField: "_id",
            as: "threadInfo",
        },
    };

    const lookupUserStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };

    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$threadInfo.members"] },
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
              totalComments: { $size: "$comments" },
          }
        : {
              joined: false,
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: false,
              downVoted: false,
              totalComments: { $size: "$comments" },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };

    const projectUserInfoStage = {
        $project: {
            "creatorInfo.email": 0,
            "creatorInfo.isVerified": 0,
            "creatorInfo.password": 0,
            "creatorInfo.refreshToken": 0,
            "creatorInfo.createdAt": 0,
            "creatorInfo.updatedAt": 0,
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const pipeline = [
        matchStage,
        lookupThreadStage,
        lookupUserStage,
        addFieldsStage,
        projectUserInfoStage,
    ];

    post = await postModel.aggregate(pipeline);

    if (!post || post.length == 0) {
        throw new ApiError(404, "Thread not found");
    }

    res.status(200).json(
        new ApiResponse(200, post, "Post fetched successfully")
    );
});

const getAllPostOfThread = asyncHandler(async (req, res) => {
    const { user, thread } = req.body;

    const pageSize = 10;
    const sortedField = "createdAt";

    let lastSortedFieldId = null;
    let lastSortedFieldValue = null;

    if (req.query.lastId) {
        lastSortedFieldId = req.query.lastId;
        const post = await postModel.findById(lastSortedFieldId);
        if (!post) {
            throw new ApiError(400, "Not a valid Post Id");
        }
        lastSortedFieldValue = post.createdAt;
    }
    const matchConditions = lastSortedFieldValue
        ? {
              createdFor: thread._id,
              [sortedField]: { $lt: lastSortedFieldValue },
              isDeleted: false,
          }
        : { createdFor: thread._id, isDeleted: false };
    const matchStage = { $match: matchConditions };

    const lookupThreadStage = {
        $lookup: {
            from: "threads",
            localField: "createdFor",
            foreignField: "_id",
            as: "threadInfo",
        },
    };

    const lookupUserStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };

    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$threadInfo.members"] },
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
              totalComments: { $size: "$comments" },
          }
        : {
              joined: false,
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: false,
              downVoted: false,
              totalComments: { $size: "$comments" },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };

    const projectUserInfoStage = {
        $project: {
            "creatorInfo.email": 0,
            "creatorInfo.isVerified": 0,
            "creatorInfo.password": 0,
            "creatorInfo.refreshToken": 0,
            "creatorInfo.createdAt": 0,
            "creatorInfo.updatedAt": 0,
            threadInfo: 0,
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const sortStage = { $sort: { [sortedField]: -1 } };

    const limitStage = { $limit: pageSize + 1 };

    const pipeline = [
        matchStage,
        lookupThreadStage,
        lookupUserStage,
        addFieldsStage,
        projectUserInfoStage,
        sortStage,
        limitStage,
    ];

    const posts = await postModel.aggregate(pipeline);

    let hasNextPage = false;

    if (posts.length > pageSize) {
        hasNextPage = true;
        posts.pop();
    }

    if (posts.length > 0) {
        const lastPost = posts[posts.length - 1];
        lastSortedFieldId = lastPost._id;
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { hasNextPage, posts, lastSortedFieldId },
            "Posts fetched successfully"
        )
    );
});

const getAllPostOfUser = asyncHandler(async (req, res) => {
    const { searchedUser, user } = req.body;

    const pageSize = 10;
    const sortedField = "createdAt";

    let lastSortedFieldId = null;
    let lastSortedFieldValue = null;

    if (req.query.lastId) {
        lastSortedFieldId = req.query.lastId;
        const post = await postModel.findById(lastSortedFieldId);
        if (!post) {
            throw new ApiError(400, "Not a valid Post Id");
        }
        lastSortedFieldValue = post.createdAt;
    }
    const matchConditions = lastSortedFieldValue
        ? {
              createdBy: searchedUser._id,
              [sortedField]: { $lt: lastSortedFieldValue },
              isDeleted: false,
          }
        : { createdBy: searchedUser._id, isDeleted: false };
    const matchStage = { $match: matchConditions };

    const lookupThreadStage = {
        $lookup: {
            from: "threads",
            localField: "createdFor",
            foreignField: "_id",
            as: "threadInfo",
        },
    };

    const lookupUserStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };

    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$threadInfo.members"] },
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
              totalComments: { $size: "$comments" },
          }
        : {
              joined: false,
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              upVoted: false,
              downVoted: false,
              totalComments: { $size: "$comments" },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };
    
    const projectThreadInfoStage = {
        $project: {
            "threadInfo.banner": 0,
            "threadInfo.tags": 0,
            "threadInfo.banner": 0,
            "threadInfo.createdAt": 0,
            "threadInfo.updatedAt": 0,
            "threadInfo.description": 0,
            "threadInfo.members": 0,
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
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const sortStage = { $sort: { [sortedField]: -1 } };

    const limitStage = { $limit: pageSize + 1 };

    const pipeline = [
        matchStage,
        lookupThreadStage,
        lookupUserStage,
        addFieldsStage,
        projectThreadInfoStage,
        projectUserInfoStage,
        sortStage,
        limitStage,
    ];

    const posts = await postModel.aggregate(pipeline);

    let hasNextPage = false;

    if (posts.length > pageSize) {
        hasNextPage = true;
        posts.pop();
    }

    if (posts.length > 0) {
        const lastPost = posts[posts.length - 1];
        lastSortedFieldId = lastPost._id;
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { hasNextPage, posts, lastSortedFieldId },
            "Posts fetched successfully"
        )
    );
});

const getAllPost = asyncHandler(async (req, res) => {
    const { user } = req.body;

    const pageSize = 10;
    const sortedField = "createdAt";

    let lastSortedFieldId = null;
    let lastSortedFieldValue = null;

    if (req.query.lastId) {
        lastSortedFieldId = req.query.lastId;
        const post = await postModel.findById(lastSortedFieldId);
        if (!post) {
            throw new ApiError(400, "Not a valid Post Id");
        }
        lastSortedFieldValue = post.createdAt;
    }
    const matchConditions = lastSortedFieldValue
        ? { [sortedField]: { $lt: lastSortedFieldValue }, isDeleted: false }
        : { isDeleted: false };
    const matchStage = { $match: matchConditions };

    const lookupThreadStage = {
        $lookup: {
            from: "threads",
            localField: "createdFor",
            foreignField: "_id",
            as: "threadInfo",
        },
    };
    const lookupUserStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };
    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$threadInfo.members"] },
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              totalComments: { $size: "$comments" },
              threadName: { $arrayElemAt: ["$threadInfo.name", 0] },
          }
        : {
              joined: false,
              upVoted: false,
              downVoted: false,
              totalVotes: {
                  $subtract: [{ $size: "$upVotes" }, { $size: "$downVotes" }],
              },
              totalComments: { $size: "$comments" },
              threadName: { $arrayElemAt: ["$threadInfo.name", 0] },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };

    const projectThreadInfoStage = {
        $project: {
            "threadInfo.banner": 0,
            "threadInfo.tags": 0,
            "threadInfo.banner": 0,
            "threadInfo.createdAt": 0,
            "threadInfo.updatedAt": 0,
            "threadInfo.description": 0,
            "threadInfo.members": 0,
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
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const sortStage = { $sort: { [sortedField]: -1 } };

    const limitStage = { $limit: pageSize + 1 };

    const pipeline = [
        matchStage,
        lookupThreadStage,
        lookupUserStage,
        addFieldsStage,
        projectThreadInfoStage,
        projectUserInfoStage,
        sortStage,
        limitStage,
    ];

    const posts = await postModel.aggregate(pipeline);

    let hasNextPage = false;

    if (posts.length > pageSize) {
        hasNextPage = true;
        posts.pop();
    }

    if (posts.length > 0) {
        const lastPost = posts[posts.length - 1];
        lastSortedFieldId = lastPost._id;
    }

    res.status(200).json(
        new ApiResponse(
            200,
            { hasNextPage, posts, lastSortedFieldId },
            "Posts fetched successfully"
        )
    );
});

export {
    createPost,
    deletePost,
    createUpVote,
    deleteUpVote,
    createDownVote,
    deleteDownVote,
    getPost,
    getAllPostOfThread,
    getAllPostOfUser,
    getAllPost,
};
