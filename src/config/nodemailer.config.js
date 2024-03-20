import nodemailer from "nodemailer";
import { EMAIL_USER, EMAIL_PASSWORD } from "../config/server.config.js";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
    },
});

export default transporter;
