import { Router } from "express";
import {
    verifyJWT,
    verifyIfUserExist,
    verifyMember,
    verifyPost,
    verifyThread,
} from "../middlewares/auth.middleware.js";
import {
    checkMember,
    createMember,
    deleteMember,
    createPost,
    createUpVote,
    deleteUpVote,
    createDownVote,
    deleteDownVote,
    getAllPostOfThread,
    getAllPost,
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
router
    .route("/create-upvote")
    .post(verifyJWT, verifyThread, verifyPost, createUpVote);

router
    .route("/delete-upvote")
    .post(verifyJWT, verifyThread, verifyPost, deleteUpVote);

router
    .route("/create-downvote")
    .post(verifyJWT, verifyThread, verifyPost, createDownVote);

router
    .route("/delete-downvote")
    .post(verifyJWT, verifyThread, verifyPost, deleteDownVote);

router
    .route("/get-allpostsofthread")
    .get(verifyIfUserExist, verifyThread, getAllPostOfThread);

router.route("/get-allposts").get(verifyIfUserExist, getAllPost);

export default router;
