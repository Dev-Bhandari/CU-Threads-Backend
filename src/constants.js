export const DB_NAME = "cuthreads";

export const COOKIE_OPTIONS = {
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

export const DEFAULT_USER_AVATAR =
    "https://res.cloudinary.com/demetdlv9/image/upload/v1712492059/default-user-avatar.png";

export const DEFAULT_THREAD_AVATAR =
    "https://res.cloudinary.com/demetdlv9/image/upload/v1722622436/default-thread-avatar.png";

export const DEFAULT_THREAD_BANNER =
    "https://res.cloudinary.com/demetdlv9/image/upload/v1712492058/default-thread-banner.png";
