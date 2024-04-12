import { Router } from "express";
import {
    verifyJWT,
    verifyMember,
    verifyThread,
} from "../middlewares/auth.middleware.js";
import {
    checkMember,
    createMember,
    deleteMember,
    createPost,
} from "../controllers/post.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/verify-member")
    .post(verifyJWT, verifyThread, verifyMember, checkMember);

router.route("/create-member").post(verifyJWT, verifyThread, createMember);

router
    .route("/delete-member")
    .post(verifyJWT, verifyThread, verifyMember, deleteMember);

router
    .route("/create-post")
    .post(
        upload.array("media"),
        verifyJWT,
        verifyThread,
        verifyMember,
        createPost
    );

export default router;
