import { Router } from "express";
import {
    verifyJWT,
    verifyIfUserExist,
    verifyMember,
    verifyPost,
    verifyThread,
} from "../middlewares/auth.middleware.js";
import {
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
    .route("/create-post/:threadName")
    .post(
        upload.array("media"),
        verifyJWT,
        verifyThread,
        verifyMember,
        createPost
    );
router.route("/create-upvote").patch(verifyJWT, verifyPost, createUpVote);

router.route("/delete-upvote").patch(verifyJWT, verifyPost, deleteUpVote);

router.route("/create-downvote").patch(verifyJWT, verifyPost, createDownVote);

router.route("/delete-downvote").patch(verifyJWT, verifyPost, deleteDownVote);

router
    .route("/get-allposts/:threadName")
    .get(verifyIfUserExist, verifyThread, getAllPostOfThread);

router.route("/get-allposts").get(verifyIfUserExist, getAllPost);

export default router;
