import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { EMAIL_TOKEN_SECRET } from "../config/server.config.js";
const verifyEmailSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        emailToken: {
            type: String,
        },
    },
    { expireAfterSeconds: 3600 }
);

verifyEmailSchema.methods.generateEmailToken = function () {
    return jwt.sign({ _id: this._id }, EMAIL_TOKEN_SECRET);
};

const verifyEmailModel = new mongoose.model("VerifyEmail", verifyEmailSchema);

export default verifyEmailModel;
