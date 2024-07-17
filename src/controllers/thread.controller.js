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
import { pipeline } from "stream";

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
        name: `${name}`,
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

const checkMember = asyncHandler(async (_, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "User is a member"));
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
        .json(
            new ApiResponse(
                200,
                { joined: true },
                `${thread.name} joined successfully`
            )
        );
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
        .json(
            new ApiResponse(
                200,
                { joined: false },
                "Member deleted successfully"
            )
        );
});

const getOneThread = asyncHandler(async (req, res) => {
    const { user } = req.body;
    const { threadName } = req.params;
    if (!threadName) {
        throw new ApiError(400, "Thread Name cannot be empty");
    }
    const matchStage = {
        $match: { name: threadName },
    };
    const lookupStage = {
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creatorInfo",
        },
    };
    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$members"] },
              totalMembers: { $size: "$members" },
              owner: { $eq: ["$createdBy", user._id] },
          }
        : {
              joined: false,
              totalMembers: { $size: "$members" },
              owner: false,
          };
    const addFieldsStage = {
        $addFields: addFieldsCondition,
    };
    const projectStage = {
        $project: {
            "creatorInfo.email": 0,
            "creatorInfo.isVerified": 0,
            "creatorInfo.password": 0,
            "creatorInfo.refreshToken": 0,
            "creatorInfo.createdAt": 0,
            "creatorInfo.updatedAt": 0,
            members: 0,
        },
    };

    const thread = await threadModel.aggregate([
        matchStage,
        lookupStage,
        addFieldsStage,
        projectStage,
    ]);

    if (!thread) {
        throw new ApiError(404, "Thread not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, thread[0], "Thread fetched successfully"));
});

const getThreads = asyncHandler(async (req, res) => {
    const { threadName } = req.body;

    const threads = await threadModel
        .find({ name: { $in: threadName } })
        .populate({ path: "createdBy", select: "-password -refreshToken" });

    if (threads.length == 0) {
        throw new ApiError(404, "Threads not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, threads, "Threads fetched successfully"));
});

const getAllThreads = asyncHandler(async (req, res) => {
    const { user } = req.body;

    const addFieldsCondition = user
        ? {
              joined: { $in: [user._id, "$members"] },
              totalMembers: { $size: "$members" },
              owner: { $eq: ["$createdBy", user._id] },
          }
        : {
              joined: false,
              totalMembers: { $size: "$members" },
              owner: false,
          };
    const addFieldsStage = {
        $addFields: addFieldsCondition,
    };
    const projectStage = {
        $project: {
            tags: 0,
            members: 0,
        },
    };

    const thread = await threadModel.aggregate([addFieldsStage, projectStage]);

    if (!thread) {
        throw new ApiError(404, "Thread not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, thread, "Thread fetched successfully"));
});

export {
    createThread,
    updateDescription,
    updateThreadAvatar,
    updateThreadBanner,
    checkMember,
    createMember,
    deleteMember,
    getOneThread,
    getThreads,
    getAllThreads,
};
