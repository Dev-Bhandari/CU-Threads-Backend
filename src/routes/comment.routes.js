import { Router } from "express";
import { createComment } from "../controllers/comment.controller";
import { verifyJWT, verifyPost } from "../middlewares/auth.middleware";

const router = Router();

router.route("create-comment").post(verifyJWT, verifyPost, createComment);
