import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} from "../config/server.config.js";

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        console.log("File uploaded on Cloudinary", response.secure_url);
        fs.unlinkSync(localFilePath);
        const fileType = response.resource_type === "video" ? "video" : "image";
        const cleanUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/${fileType}/upload/${response.public_id}`;
        response.secure_url = cleanUrl;
        return response;
    } catch (error) {
        console.log("Removing file");
        console.log(localFilePath);
        fs.unlinkSync(localFilePath);
        return null;
    }
};

export default uploadOnCloudinary;
