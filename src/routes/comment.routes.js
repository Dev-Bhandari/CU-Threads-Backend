import { Router } from "express";
import {
    createComment,
    deleteComment,
    getAllComment,
} from "../controllers/comment.controller.js";
import {
    verifyParentComment,
    verifyJWT,
    verifyPost,
    verifyComment,
    verifyIsVerified,
    verifyCommentCreator,
} from "../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/create-comment")
    .post(
        verifyJWT,
        verifyIsVerified,
        verifyPost,
        verifyParentComment,
        createComment
    );

router
    .route("/delete-comment/:commentId")
    .delete(
        verifyJWT,
        verifyIsVerified,
        verifyComment,
        verifyCommentCreator,
        deleteComment
    );

router.route("/get-allcomments/:postId").get(verifyPost, getAllComment);

export default router;
