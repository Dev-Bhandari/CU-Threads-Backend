import { Router } from "express";
import {
    registerUser,
    generateNewEmailLink,
    verifyEmail,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserAvatar,
    getOneUser,
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/get-new-link").post(generateNewEmailLink);

router.route("/login").post(loginUser);

router.route("/verify-email").post(verifyEmail);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT, changeCurrentPassword);

router
    .route("/change-avatar")
    .patch(upload.single("avatar"), verifyJWT, updateUserAvatar);

router.route("/get-current-user").get(verifyJWT, getCurrentUser);

router.route("/get-one-user/:username").get(getOneUser);

export default router;
