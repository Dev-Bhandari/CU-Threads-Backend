export const DB_NAME = "cuthreads";

export const COOKIE_OPTIONS = {
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};

export const DEFAULT_AVATAR =
    "https://res.cloudinary.com/demetdlv9/image/upload/v1712492059/default-avatar.png";

export const DEFAULT_BANNER =
    "https://res.cloudinary.com/demetdlv9/image/upload/v1712492058/default-banner.png";
