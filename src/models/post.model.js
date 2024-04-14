import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        createdFor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Thread",
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
            default: false,
        },
        mediaUrl: [
            {
                type: String,
            },
        ],
        mediaType: {
            type: String,
            enum: ["image", "video"],
        },
        upVotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        downVotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        totalVotes: {
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
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export const postModel = mongoose.model("Post", postSchema);
