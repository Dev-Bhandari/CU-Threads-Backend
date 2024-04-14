import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import { postModel, threadModel } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import { validateCreatePost } from "../utils/validation/post.validation.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const checkMember = asyncHandler(async (_, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "User is joined"));
});

const createMember = asyncHandler(async (req, res) => {
    const { user, thread } = req.body;
    if (
        thread.members.includes(user._id) ||
        thread.createdBy.toString() == user._id.toString()
    ) {
        throw new ApiError(400, `User has already joined ${thread.name}`);
    }
    await threadModel.findByIdAndUpdate(thread._id, {
        $push: { members: user },
    });
    return res
        .status(201)
        .json(new ApiResponse(200, {}, `${thread.name} joined successfully`));
});

const deleteMember = asyncHandler(async (req, res) => {
    const { user, thread } = req.body;
    if (thread.createdBy.toString() == user._id.toString()) {
        throw new ApiError(400, "Cannot remove the owner");
    }
    await threadModel.findByIdAndUpdate(thread._id, {
        $pull: { members: user._id },
    });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Member deleted successfully"));
});

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
    await postModel.findByIdAndUpdate(post._id, {
        $push: { upVotes: user },
        $inc: { totalVotes: downVoted ? 2 : 1 },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Upvoted successfully"));
});

const deleteUpVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const upVoted = post.upVotes.includes(user._id);

    if (!upVoted) {
        throw new ApiError(400, "Upvoted does not exist");
    }
    await postModel.findByIdAndUpdate(post._id, {
        $pull: { upVotes: user._id },
        $inc: { totalVotes: -1 },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Upvote removed successfully"));
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
    await postModel.findByIdAndUpdate(post._id, {
        $push: { downVotes: user },
        $inc: { totalVotes: upVoted ? -2 : -1 },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Downvoted successfully"));
});

const deleteDownVote = asyncHandler(async (req, res) => {
    const { user, post } = req.body;
    const downVoted = post.downVotes.includes(user._id);

    if (!downVoted) {
        throw new ApiError(400, "Downvoted does not exist");
    }
    await postModel.findByIdAndUpdate(post._id, {
        $pull: { downVotes: user._id },
        $inc: { totalVotes: 1 },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Downvote removed successfully"));
});

const getAllPostOfThread = asyncHandler(async (req, res) => {
    const { user, thread, sortBy } = req.body;

    const matchStage = {
        $match: { createdFor: thread._id },
    };

    const addFieldsCondition = user
        ? {
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
          }
        : {
              upVoted: { $not: "" },
              downVoted: { $not: "" },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };

    const projectStage = {
        $project: {
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const sortCondition =
        sortBy == "hot" ? { totalVotes: -1 } : { createdAt: -1 };
    const sortStage = { $sort: sortCondition };

    const posts = await postModel.aggregate([
        matchStage,
        addFieldsStage,
        projectStage,
        sortStage,
    ]);

    res.status(200).json(
        new ApiResponse(200, posts, "Posts fetched successfully")
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
        ? { [sortedField]: { $lt: lastSortedFieldValue } }
        : {};
    const matchStage = { $match: matchConditions };

    const addFieldsCondition = user
        ? {
              upVoted: { $in: [user._id, "$upVotes"] },
              downVoted: {
                  $in: [user._id, "$downVotes"],
              },
          }
        : {
              upVoted: { $not: "" },
              downVoted: { $not: "" },
          };
    const addFieldsStage = { $addFields: addFieldsCondition };

    const projectStage = {
        $project: {
            upVotes: 0,
            downVotes: 0,
            comments: 0,
        },
    };

    const sortStage = { $sort: { [sortedField]: -1 } };

    const limitStage = { $limit: pageSize + 1 };

    const pipeline = [
        matchStage,
        addFieldsStage,
        projectStage,
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
    checkMember,
    createMember,
    deleteMember,
    createPost,
    createUpVote,
    deleteUpVote,
    createDownVote,
    deleteDownVote,
    getAllPostOfThread,
    getAllPost,
};