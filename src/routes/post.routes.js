import { Router } from "express";
import {
    verifyJWT,
    verifyCurrUserExist,
    verifyMember,
    verifyPost,
    verifyThread,
    verifyPostCreator,
    verifyUserExist,
    verifyIsVerified,
} from "../middlewares/auth.middleware.js";
import {
    createPost,
    deletePost,
    createUpVote,
    deleteUpVote,
    createDownVote,
    deleteDownVote,
    getPost,
    getAllPostOfThread,
    getAllPostOfUser,
    getAllPost,
} from "../controllers/post.controller.js";
import upload from "../middlewares/multer.middleware.js";

const router = Router();

router
    .route("/create-post/:threadName")
    .post(
        upload.array("media"),
        verifyJWT,
        verifyIsVerified,
        verifyThread,
        verifyMember,
        createPost
    );

router
    .route("/delete-post/:postId")
    .delete(
        verifyJWT,
        verifyIsVerified,
        verifyPost,
        verifyPostCreator,
        deletePost
    );

router
    .route("/create-upvote")
    .patch(verifyJWT, verifyIsVerified, verifyPost, createUpVote);

router
    .route("/delete-upvote")
    .patch(verifyJWT, verifyIsVerified, verifyPost, deleteUpVote);

router
    .route("/create-downvote")
    .patch(verifyJWT, verifyIsVerified, verifyPost, createDownVote);

router
    .route("/delete-downvote")
    .patch(verifyJWT, verifyIsVerified, verifyPost, deleteDownVote);

router.route("/get-post/:postId").get(verifyCurrUserExist, verifyPost, getPost);

router
    .route("/get-posts-thread/:threadName")
    .get(verifyCurrUserExist, verifyThread, getAllPostOfThread);

router
    .route("/get-posts-user/:username")
    .get(verifyUserExist, verifyCurrUserExist, getAllPostOfUser);

router.route("/get-allposts").get(verifyCurrUserExist, getAllPost);

export default router;
