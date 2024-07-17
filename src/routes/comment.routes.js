import { Router } from "express";
import {
    createComment,
    getAllComment,
} from "../controllers/comment.controller.js";
import {
    verifyComment,
    verifyJWT,
    verifyPost,
} from "../middlewares/auth.middleware.js";

const router = Router();

router
    .route("/create-comment")
    .post(verifyJWT, verifyPost, verifyComment, createComment);

router.route("/get-allcomments/:postId").get(verifyPost, getAllComment);

export default router;
