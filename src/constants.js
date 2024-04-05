import { FRONTEND_ENDPOINT } from "./config/server.config.js";

export const DB_NAME = "cuthreads";

export const COOKIE_OPTIONS = {
    expires: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
    domain: FRONTEND_ENDPOINT,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
};
