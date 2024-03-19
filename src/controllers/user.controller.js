import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import zod from "zod";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import { REFRESH_TOKEN_SECRET } from "../config/server.config.js";

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

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    const userZodResponse = userZodObject.safeParse({
        username,
        email,
        password,
    });

    if (!userZodResponse.success) {
        throw new ApiError(400, "write fields properly");
    }
    let avatarLocalPath;

    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        avatarLocalPath = req.files.avatar[0].path;
    } else {
        throw new ApiError(400, "Avatar file is required");
    }

    const existedUser = await userModel.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        fs.unlinkSync(avatarLocalPath);
        throw new ApiError(409, "User with email or username already exist");
    }

    const avatarFile = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarFile) {
        throw new ApiError(400, "Avatar file is required");
    }

    const user = await userModel.create({
        username,
        avatar: avatarFile?.url,
        email,
        password,
    });

    const createdUser = await userModel
        .findById(user._id)
        .select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }
    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
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
        throw new ApiError(400, "write fields properly");
    }

    let user = await userModel
        .findOne({ $or: [{ username }, { email }] })
        .select("-refreshToken");

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid username or password");
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await userModel
        .findById(user._id)
        .select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, loggedInUser, "User logged in successfully")
        );
});

const logoutUser = async (req, res) => {
    await userModel.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1,
        },
    });

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
};

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookie.refreshToken || req.headers.refreshToken;
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

        const options = {
            httpOnly: true,
            secure: true,
        };
        const { accessToken, refreshToken } =
            await generateAccessTokenAndRefreshToken(user._id);
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
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

export { registerUser, loginUser, logoutUser, refreshAccessToken };
