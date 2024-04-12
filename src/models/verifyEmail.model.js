import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { EMAIL_TOKEN_SECRET } from "../config/server.config.js";

const verifyEmailSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600,
    },
});

verifyEmailSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });

verifyEmailSchema.methods.generateEmailToken = function () {
    return jwt.sign({ _id: this._id }, EMAIL_TOKEN_SECRET);
};

export const verifyEmailModel = new mongoose.model(
    "VerifyEmail",
    verifyEmailSchema
);
