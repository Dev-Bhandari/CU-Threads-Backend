import { threadModel } from "../models/index.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    validateCreateThread,
    validateUpdateDescription,
} from "../utils/validation/thread.validation.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import fs from "fs";

const createThread = asyncHandler(async (req, res) => {
    const { user, name } = req.body;
    const error = validateCreateThread(name);

    if (error) {
        throw new ApiError(400, error.toString());
    }

    const existedThread = await threadModel.findOne({ name: `cu/${name}` });
    if (existedThread) {
        throw new ApiError(400, `${existedThread.name} is already taken`);
    }

    const thread = await threadModel.create({
        createdBy: user,
        name: `cu/${name}`,
        members: [user],
    });
    const threadObject = thread.toObject();
    delete threadObject.createdBy;
    return res
        .status(201)
        .json(
            new ApiResponse(201, threadObject, `${threadObject.name} created`)
        );
});

const updateDescription = asyncHandler(async (req, res) => {
    const { thread, description } = req.body;
    const error = validateUpdateDescription(description);
    if (error) {
        throw new ApiError(400, error.toString());
    }
    thread.description = description;
    thread.save({ validateBeforeSafe: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                thread,
                "Thread description edited successfully"
            )
        );
});

const updateThreadAvatar = asyncHandler(async (req, res) => {
    const { thread } = req.body;
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.secure_url) {
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(400, "Error while uploading avatar");
    }
    const newThread = await threadModel
        .findByIdAndUpdate(
            thread._id,
            {
                $set: { avatar: avatar.secure_url },
            },
            { new: true }
        )
        .select("-createdBy");
    return res
        .status(200)
        .json(new ApiResponse(200, newThread, "Avatar uploaded successfully"));
});

const updateThreadBanner = asyncHandler(async (req, res) => {
    const { thread } = req.body;
    const bannerLocalPath = req.file?.path;
    if (!bannerLocalPath) {
        throw new ApiError(400, "Banner file is required");
    }
    const banner = await uploadOnCloudinary(bannerLocalPath);

    if (!banner.secure_url) {
        fs.unlinkSync(bannerLocalPath);
        throw new ApiError(400, "Error while uploading banner");
    }
    const newThread = await threadModel
        .findByIdAndUpdate(
            thread._id,
            {
                $set: { banner: banner.secure_url },
            },
            { new: true }
        )
        .select("-createdBy");
    return res
        .status(200)
        .json(new ApiResponse(200, newThread, "Banner uploaded successfully"));
});

const getOneThread = asyncHandler(async (req, res) => {
    const { threadId } = req.body;
    const thread = await threadModel
        .findById(threadId)
        .populate({ path: "createdBy", select: "-password -refreshToken" });

    if (!thread) {
        throw new ApiError(404, "Thread not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, thread, "Thread fetched successfully"));
});

const getThreads = asyncHandler(async (req, res) => {
    const { threadIds } = req.body;

    // threadModel.aggregate([{ $match: { _id: threadIds } }, {}]);
    const threads = await threadModel
        .find({ _id: { $in: threadIds } })
        .populate({ path: "createdBy", select: "-password -refreshToken" });

    if (threads.length == 0) {
        throw new ApiError(404, "Threads not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, threads, "Threads fetched successfully"));
});

const getAllThreads = asyncHandler(async (req, res) => {
    const threads = await threadModel
        .find()
        .populate({ path: "createdBy", select: "-password -refreshToken" });

    return res
        .status(200)
        .json(
            new ApiResponse(200, threads, "All threads fetched successfully")
        );
});

export {
    createThread,
    updateDescription,
    updateThreadAvatar,
    updateThreadBanner,
    getOneThread,
    getThreads,
    getAllThreads,
};
