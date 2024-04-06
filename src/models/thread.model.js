import mongoose from "mongoose";
import { DEFAULT_AVATAR } from "../constants.js";

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
        },
        tag: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "tag",
            },
        ],
    },
    { timestamps: true }
);

export const threadModel = mongoose.model("Thread", threadSchema);
