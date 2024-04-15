import { Router } from "express";
import {
    createThread,
    updateDescription,
    updateThreadAvatar,
    updateThreadBanner,
    checkMember,
    createMember,
    deleteMember,
    getAllThreads,
    getOneThread,
    getThreads,
} from "../controllers/thread.controller.js";
import {
    verifyJWT,
    verifyCreater,
    verifyThread,
    verifyMember,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/create-thread").post(verifyJWT, createThread);

router
    .route("/change-description")
    .post(verifyJWT, verifyThread, verifyCreater, updateDescription);

router
    .route("/change-avatar")
    .patch(
        upload.single("avatar"),
        verifyJWT,
        verifyThread,
        verifyCreater,
        updateThreadAvatar
    );

router
    .route("/change-banner")
    .patch(
        upload.single("banner"),
        verifyJWT,
        verifyThread,
        verifyCreater,
        updateThreadBanner
    );

router
    .route("/verify-member")
    .post(verifyJWT, verifyThread, verifyMember, checkMember);

router.route("/create-member").post(verifyJWT, verifyThread, createMember);

router
    .route("/delete-member")
    .post(verifyJWT, verifyThread, verifyMember, deleteMember);

router.route("/get-onethread").get(getOneThread);

router.route("/get-threads").get(getThreads);

router.route("/get-allthreads").get(getAllThreads);

export default router;
