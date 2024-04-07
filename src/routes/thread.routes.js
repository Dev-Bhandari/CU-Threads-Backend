import { Router } from "express";
import {
    createThread,
    editDescription,
    editAvatar,
    editBanner,
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
    .route("/edit-avatar")
    .post(upload.single("avatar"), verifyJWT, verifyCreater, editAvatar);

router
    .route("/edit-banner")
    .post(upload.single("banner"), verifyJWT, verifyCreater, editBanner);

router.route("/get-onethread").get(getOneThread);

router.route("/get-threads").get(getThreads);

router.route("/get-allthreads").get(getAllThreads);

export default router;
