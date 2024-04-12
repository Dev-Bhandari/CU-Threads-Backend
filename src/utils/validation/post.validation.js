import zod from "zod";
import customValidationErrorProvider from "./index.validation.js";

const title = zod.string().trim().min(1, { message: "Title cannot be empty" });

const content = zod
    .string()
    .max(500, "Content cannot be more than 500 characters");

const createPostZodObject = zod.object({
    title,
    content,
});

const validateCreatePost = (title, content) => {
    try {
        createPostZodObject.parse({ title, content });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

export { validateCreatePost };
