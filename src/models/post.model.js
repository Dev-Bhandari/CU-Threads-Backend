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
            required: true,
            trim: true,
        },
        pinned: {
            type: Boolean,
            required: true,
        },
        photoUrl: {
            type: String,
        },
        videoUrl: {
            type: String,
        },
        mediaType: {
            type: String,
            enum: ["photo", "video", "text", "mixed"],
            default: "text",
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
        tag: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Tag",
            },
        ],
    },
    { timestamps: true }
);

export const postModel = mongoose.model("Post", postSchema);
