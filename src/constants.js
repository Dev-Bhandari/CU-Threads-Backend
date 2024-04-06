export const DB_NAME = "cuthreads";

export const COOKIE_OPTIONS = {
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};
