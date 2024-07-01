import zod from "zod";
import customValidationErrorProvider from "./index.validation.js";

const title = zod.string().trim().min(1, { message: "Title cannot be empty" });

const textContent = zod
    .string()
    .trim()
    .max(1000, "Text cannot be more than 1000 characters");

const createPostZodObject = zod.object({
    title,
    textContent,
});

const validateCreatePost = (title, textContent) => {
    try {
        createPostZodObject.parse({ title, textContent });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

export { validateCreatePost };
