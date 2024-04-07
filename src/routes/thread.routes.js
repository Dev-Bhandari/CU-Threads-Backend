import { Router } from "express";
import {
    createThread,
    editDescription,
    updateThreadAvatar,
    updateThreadBanner,
    getAllThreads,
    getOneThread,
    getThreads,
} from "../controllers/thread.controller.js";
import { verifyJWT, verifyCreater } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/create-thread").post(verifyJWT, createThread);

router
    .route("/edit-description")
    .post(verifyJWT, verifyCreater, editDescription);

router
    .route("/change-avatar")
    .patch(
        upload.single("avatar"),
        verifyJWT,
        verifyCreater,
        updateThreadAvatar
    );

router
    .route("/change-banner")
    .patch(
        upload.single("banner"),
        verifyJWT,
        verifyCreater,
        updateThreadBanner
    );

router.route("/get-onethread").get(getOneThread);

router.route("/get-threads").get(getThreads);

router.route("/get-allthreads").get(getAllThreads);

export default router;
