import zod from "zod";
import customValidationErrorProvider from "./index.validation.js";

const content = zod
    .string()
    .trim()
    .max(500, "Comment cannot be more than 500 characters");

const createCommentZodObject = zod.object({
    content,
});

const validateCreateComment = (content) => {
    try {
        createCommentZodObject.parse({ content });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

export { validateCreateComment };
