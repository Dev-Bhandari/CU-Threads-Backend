import { threadModel } from "../models/thread.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
    validateCreateThread,
    validateEditDescription,
} from "../utils/validation/thread.validation.js";

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
    });
    const threadObject = thread.toObject();
    delete threadObject.createdBy;
    return res
        .status(201)
        .json(
            new ApiResponse(201, threadObject, `${threadObject.name} created`)
        );
});

const editDescription = asyncHandler(async (req, res) => {
    const { thread, description } = req.body;
    const error = validateEditDescription(description);
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

const editAvatar = asyncHandler(async (req, res) => {
    const { thread } = req.body;
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    const newThread = await threadModel
        .findByIdAndUpdate(thread._id, {
            $set: { avatar: avatar.url },
        })
        .select("-createdBy");
    return res
        .status(200)
        .json(new ApiResponse(200, newThread, "Avatar uploaded successfully"));
});

const editBanner = asyncHandler(async (req, res) => {
    const { thread } = req.body;
    const bannerLocalPath = req.file?.path;
    if (!bannerLocalPath) {
        throw new ApiError(400, "Banner file is required");
    }
    const banner = await uploadOnCloudinary(bannerLocalPath);

    if (!banner.url) {
        throw new ApiError(400, "Error while uploading banner");
    }
    const newThread = await threadModel
        .findByIdAndUpdate(thread._id, {
            $set: { banner: banner.url },
        })
        .select("-createdBy");
    return res
        .status(200)
        .json(new ApiResponse(200, newThread, "Banner uploaded successfully"));
});

export { createThread, editDescription, editAvatar, editBanner };
