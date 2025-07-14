import { CLOUDINARY_CLOUD_NAME } from "./config/server.config.js";

export const DB_NAME = "cuthreads";

export const COOKIE_OPTIONS = {
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

export const DEFAULT_USER_AVATAR =
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/default-user-avatar`;

export const DEFAULT_THREAD_AVATAR =
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/default-thread-avatar`;

export const DEFAULT_THREAD_BANNER =
    `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/default-thread-banner`;
