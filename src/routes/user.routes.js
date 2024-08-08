import { Router } from "express";
import {
    registerUser,
    verifyEmail,
    loginUser,
    generateForgotPasswordEmail,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    getOneUser,
    generateVerifyEmail,
    verifyForgotPasswordEmail,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRefreshToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/get-new-link").post(generateVerifyEmail);

router.route("/login").post(loginUser);

router.route("/verify-email").post(verifyEmail);

router.route("/forgot-password").post(generateForgotPasswordEmail);

router.route("/verify-forgot-password").post(verifyForgotPasswordEmail);

router.route("/logout").post(verifyRefreshToken, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router
    .route("/change-avatar")
    .patch(upload.single("avatar"), verifyJWT, updateUserAvatar);

router.route("/get-current-user").get(verifyJWT, getCurrentUser);

router.route("/get-one-user/:username").get(getOneUser);

export default router;
