import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import verifyEmailModel from "../models/verifyEmail.model.js";
import zod from "zod";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import {
    SERVER_ENDPOINT,
    PORT,
    EMAIL_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
} from "../config/server.config.js";
import transporter from "../config/nodemailer.config.js";
import { COOKIE_OPTIONS } from "../constants.js";

const userZodObject = zod.object({
    username: zod.string(),
    email: zod.string().email(),
    password: zod.string(),
});

const generateAccessTokenAndRefreshToken = async function (userId) {
    try {
        const user = await userModel.findById(userId).select("-password");

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSafe: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access token and refresh token"
        );
    }
};

const generateEmail = async function (user) {
    try {
        await verifyEmailModel.deleteOne({ userId: user._id });
        await verifyEmailModel.create({
            userId: user._id,
        });

        const verifyEmailObject = await verifyEmailModel.findOne({
            userId: user._id,
        });
        const emailToken = verifyEmailObject.generateEmailToken();
        verifyEmailObject.emailToken = emailToken;
        await verifyEmailObject.save({ validateBeforeSafe: false });

        console.log(`Email Token : ${emailToken}`);
        const url = `${SERVER_ENDPOINT}:${PORT}/api/v1/users/verify?emailToken=${emailToken}`;

        await transporter.sendMail({
            from: "CU Threads <cuthreadsofficial@gmail.com>",
            to: user.email,
            subject: "Confirm Email",
            html: `Please click this link to confirm your email for registration on CU Threads: <a href="${url}">${url}</a>`,
        });
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while generating email."
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const userZodResponse = userZodObject.safeParse({
        username,
        email,
        password,
    });

    if (!userZodResponse.success) {
        throw new ApiError(400, "write fields properly.");
    }

    const avatarLocalPath = req.file?.path;

    const existedUser = await userModel.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(409, "User with email or username already exist.");
    }
    let avatarFile;
    if (avatarLocalPath) {
        avatarFile = await uploadOnCloudinary(avatarLocalPath);
    }
    const user = await userModel.create({
        username,
        avatar: avatarFile?.url,
        email,
        password,
    });

    const userId = user._id;

    const currentUser = await userModel
        .findById(userId)
        .select("-password -refreshToken");

    if (!currentUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user."
        );
    }
    await generateEmail(currentUser);
    res.status(201).json(
        new ApiResponse(200, currentUser, "User verification pending.")
    );
});

const generateNewEmailLink = asyncHandler(async (req, res) => {
    const userId = req.body?.userId;
    const currentUser = await userModel
        .findById(userId)
        .select("-password -refreshToken");
    if (!currentUser) {
        throw new ApiError(404, "User does not exist.");
    }
    if (currentUser.isVerified) {
        throw new ApiError(400, "User already verified.");
    }
    await generateEmail(currentUser);
    res.status(200).json(
        new ApiResponse(200, {}, "Verification link send sucessfully.")
    );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const emailToken = req.query.emailToken;
    if (!emailToken) {
        throw new ApiError(401, "Unauthorised Request.");
    }
    const decodedEmailToken = jwt.verify(emailToken, EMAIL_TOKEN_SECRET);
    const verifyEmailObject = await verifyEmailModel.findById(
        decodedEmailToken?._id
    );
    if (!verifyEmailObject) {
        throw new ApiError(401, "Invalid or expired email token.");
    }

    const user = await userModel
        .findById(verifyEmailObject.userId)
        .select("-password");

    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    await verifyEmailModel.deleteOne({ userId: user._id });

    res.status(200).json(
        new ApiResponse(
            200,
            verifyEmailObject.userId,
            "User verified successfully."
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const userZodResponse = userZodObject.safeParse({
        username,
        email,
        password,
    });

    if (!userZodResponse.success) {
        throw new ApiError(400, "Write fields properly.");
    }

    let user = await userModel
        .findOne({ $or: [{ username }, { email }] })
        .select("-refreshToken");

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid username or password.");
    }

    const currentUser = await userModel
        .findById(user._id)
        .select("-password -refreshToken");

    if (!currentUser.isVerified) {
        return res
            .status(400)
            .json(new ApiResponse(400, currentUser, "User not verified"));
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .json(new ApiResponse(200, currentUser, "User logged in successfully"));
});

const logoutUser = async (req, res) => {
    await userModel.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1,
        },
    });

    return res
        .status(200)
        .clearCookie("accessToken", COOKIE_OPTIONS)
        .clearCookie("refreshToken", COOKIE_OPTIONS)
        .json(new ApiResponse(200, {}, "User logged out"));
};

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.headers.refreshToken;
    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised request");
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            REFRESH_TOKEN_SECRET
        );

        const user = await userModel.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired");
        }

        const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, COOKIE_OPTIONS)
            .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Generated new access token"
                )
            );
    } catch (error) {
        throw new ApiError(
            401,
            error?.message ||
                "Something went wrong while renewing the access token"
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(401, "All fields are required");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            401,
            "New password and confirm password is not same"
        );
    }

    if (oldPassword === newPassword) {
        throw new ApiError(401, "New password and old password cannot be same");
    }

    const user = await userModel.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar");
    }
    await userModel.findByIdAndUpdate(req.user?._id, {
        $set: { avatar: avatar.url },
    });
});

export {
    registerUser,
    generateNewEmailLink,
    verifyEmail,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
};
