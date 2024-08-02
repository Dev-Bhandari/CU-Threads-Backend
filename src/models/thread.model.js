import mongoose from "mongoose";
import { DEFAULT_THREAD_AVATAR, DEFAULT_THREAD_BANNER } from "../constants.js";

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
            default: DEFAULT_THREAD_AVATAR,
        },
        banner: {
            type: String,
            default: DEFAULT_THREAD_BANNER,
        },

        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        tags: [{ type: String }],
    },
    { timestamps: true }
);

export const threadModel = mongoose.model("Thread", threadSchema);
