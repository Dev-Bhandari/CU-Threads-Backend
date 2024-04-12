import zod from "zod";
import customValidationErrorProvider from "./index.validation.js";

const name = zod
    .string()
    .min(3, { message: "Thread name should be minimum 3 characters" })
    .refine((s) => !s.includes(" "), "No spaces in thread name")
    .refine((value) => {
        const regex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        return !regex.test(value);
    }, "No symbols in thread name");

const description = zod
    .string()
    .max(500, "Thread description cannot be more than 500 characters");

const createThreadZodObject = zod.object({
    name,
});

const editDescriptionZodObject = zod.object({
    description,
});

const validateCreateThread = (name) => {
    try {
        createThreadZodObject.parse({ name });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

const validateUpdateDescription = (description) => {
    try {
        editDescriptionZodObject.parse({ description });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

export { validateCreateThread ,validateUpdateDescription};
