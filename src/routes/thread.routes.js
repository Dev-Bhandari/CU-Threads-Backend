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
    verifyIfUserExist,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/create-thread").post(verifyJWT, createThread);

router
    .route("/change-description/:threadName")
    .post(verifyJWT, verifyThread, verifyCreater, updateDescription);

router
    .route("/change-avatar/:threadName")
    .patch(
        upload.single("avatar"),
        verifyJWT,
        verifyThread,
        verifyCreater,
        updateThreadAvatar
    );

router
    .route("/change-banner/:threadName")
    .patch(
        upload.single("banner"),
        verifyJWT,
        verifyThread,
        verifyCreater,
        updateThreadBanner
    );

router
    .route("/verify-member/:threadName")
    .post(verifyJWT, verifyThread, verifyMember, checkMember);

router
    .route("/create-member/:threadName")
    .post(verifyJWT, verifyThread, createMember);

router
    .route("/delete-member/:threadName")
    .post(verifyJWT, verifyThread, verifyMember, deleteMember);

router.route("/get-onethread/:threadName").get(verifyIfUserExist, getOneThread);

router.route("/get-threads").post(verifyIfUserExist, getThreads);

router.route("/get-allthreads").get(verifyIfUserExist, getAllThreads);

export default router;
