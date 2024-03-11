import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT;
const MONGODB_URL = process.env.MONGODB_URL;
const SECRET_KEY = process.env.SECRET_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN;

export { PORT, MONGODB_URL, SECRET_KEY, CORS_ORIGIN };
