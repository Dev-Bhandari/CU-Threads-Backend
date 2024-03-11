import mongoose from "mongoose";
import { MONGODB_URL } from "./server.config.js";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${MONGODB_URL}/${DB_NAME}`
        );
        console.log(
            `MongoDB Connected !! DB Host : ${connectionInstance.connection.host}`
        );
        console.log();
    } catch (error) {
        console.log("MongoDB Connection Failed : ", error);
        process.exit(1);
    }
};

export { connectDB };
