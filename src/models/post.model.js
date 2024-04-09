import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        textContent: {
            type: String,
            trim: true,
        },
        pinned: {
            type: Boolean,
            required: true,
        },
        mediaUrl: [
            {
                type: String,
            },
        ],
        mediaType: {
            type: String,
            enum: ["photo", "video"],
        },
        upvotes: {
            type: Number,
            default: 0,
        },
        downvotes: {
            type: Number,
            default: 0,
        },
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
        tags: [
            {
                type: String,
            },
        ],
    },
    { timestamps: true }
);

export const postModel = mongoose.model("Post", postSchema);
