import mongoose from "mongoose";
import { DEFAULT_AVATAR, DEFAULT_BANNER } from "../constants.js";

const threadSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        avatar: {
            type: String,
            default: DEFAULT_AVATAR,
        },
        banner: {
            type: String,
            default: DEFAULT_BANNER,
        },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

export const threadModel = mongoose.model("Thread", threadSchema);
