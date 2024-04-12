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
    if (thread.members.includes(user._id)) {
        throw new ApiError(400, `User is already a joined ${thread.name}`);
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

export { checkMember, createMember, deleteMember, createPost };
