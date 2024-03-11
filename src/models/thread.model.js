import mongoose from "mongoose";

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
            required: true,
            trim: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        banner: {
            type: String,
            required: true,
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
