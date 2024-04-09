import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import userModel from "../models/user.model.js";
import verifyEmailModel from "../models/verifyEmail.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import {
    EMAIL_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
} from "../config/server.config.js";
import { mailer } from "../config/nodemailer.config.js";
import { COOKIE_OPTIONS } from "../constants.js";
import {
    validateUserRegister,
    validateUserLogin,
} from "../utils/validation/user.validation.js";

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

        console.log(`Email Token : ${emailToken}`);
        await mailer(user, emailToken);
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong while generating email."
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    const error = validateUserRegister(username, email, password);

    if (error) {
        throw new ApiError(400, error);
    }
    let existedUser = await userModel.findOne({ email });

    if (existedUser) {
        throw new ApiError(409, "User with email already exist.");
    }

    existedUser = await userModel.findOne({ username });

    if (existedUser) {
        throw new ApiError(409, "User with username already exist.");
    }

    const user = await userModel.create({
        username,
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
        new ApiResponse(201, currentUser, "User verification pending.")
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
        new ApiResponse(200, user, "User verified successfully.")
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const error = validateUserLogin(email, password);

    if (error) {
        throw new ApiError(400, error.toString());
    }

    let user = await userModel.findOne({ email }).select("-refreshToken");

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password.");
    }

    const currentUser = await userModel
        .findById(user._id)
        .select("-password -refreshToken");

    if (!currentUser.isVerified) {
        await generateEmail(currentUser);
        return res
            .status(202)
            .json(
                new ApiResponse(202, currentUser, "User verification pending")
            );
    }

    const { accessToken, refreshToken } =
        await generateAccessTokenAndRefreshToken(user._id);

    return res
        .status(201)
        .cookie("accessToken", accessToken, COOKIE_OPTIONS)
        .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
        .json(new ApiResponse(201, currentUser, "User logged in successfully"));
});

const logoutUser = async (req, res) => {
    const { user } = req.body;
    await userModel.findByIdAndUpdate(user._id, {
        $unset: {
            refreshToken: 1,
        },
    });

    return res
        .status(200)
        .clearCookie("accessToken", {
            secure: true,
            sameSite: "none",
        })
        .clearCookie("refreshToken", {
            secure: true,
            sameSite: "none",
        })
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
    const { user, oldPassword, newPassword, confirmPassword } = req.body;

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
    const { user } = req.body;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userObject,
                "Current user fetched successfully"
            )
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const user = await userModel
        .findByIdAndUpdate(
            req.body.user._id,
            {
                $set: { avatar: avatar.url },
            },
            { new: true }
        )
        .select("-password -refreshToken");
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar uploaded successfully"));
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
