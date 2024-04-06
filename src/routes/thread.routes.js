import { Router } from "express";
import {
    createThread,
    editDescription,
    editAvatar,
    editBanner,
} from "../controllers/thread.controller.js";
import { verifyJWT, verifyCreater } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/create-thread").post(verifyJWT, createThread);

router
    .route("/edit-description")
    .post(verifyJWT, verifyCreater, editDescription);

router
    .route("/edit-avatar")
    .post(verifyJWT, verifyCreater, upload.single("avatar"), editAvatar);
router
    .route("/edit-banner")
    .post(verifyJWT, verifyCreater, upload.single("banner"), editBanner);

export default router;
