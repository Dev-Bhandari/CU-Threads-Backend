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
    verifyThreadCreator,
    verifyThread,
    verifyMember,
    verifyCurrUserExist,
    verifyIsVerified,
} from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/create-thread").post(verifyJWT, verifyIsVerified, createThread);

router
    .route("/change-description/:threadName")
    .post(
        verifyJWT,
        verifyIsVerified,
        verifyThread,
        verifyThreadCreator,
        updateDescription
    );

router
    .route("/change-avatar/:threadName")
    .patch(
        upload.single("avatar"),
        verifyJWT,
        verifyIsVerified,
        verifyThread,
        verifyThreadCreator,
        updateThreadAvatar
    );

router
    .route("/change-banner/:threadName")
    .patch(
        upload.single("banner"),
        verifyJWT,
        verifyIsVerified,
        verifyThread,
        verifyThreadCreator,
        updateThreadBanner
    );

router
    .route("/verify-member/:threadName")
    .post(verifyJWT, verifyIsVerified, verifyThread, verifyMember, checkMember);

router
    .route("/create-member/:threadName")
    .post(verifyJWT, verifyIsVerified, verifyThread, createMember);

router
    .route("/delete-member/:threadName")
    .delete(
        verifyJWT,
        verifyIsVerified,
        verifyThread,
        verifyMember,
        deleteMember
    );

router
    .route("/get-onethread/:threadName")
    .get(verifyCurrUserExist, getOneThread);

router.route("/get-threads").post(verifyCurrUserExist, getThreads);

router.route("/get-allthreads").get(verifyCurrUserExist, getAllThreads);

export default router;
