import zod from "zod";
import { fromZodError } from "zod-validation-error";

const username = zod
    .string()
    .min(3, { message: "Username should be of minimum 3 characters" });
const email = zod.string().email({ message: "Invalid email" });
const password = zod
    .string()
    .min(6, { message: "Password should be of minimum 6 characters" });

const userLoginZodObject = zod.object({
    email,
    password,
});

const userRegisterZodObject = zod.object({
    username,
    email,
    password,
});

const customValidationErrorProvider = (validationError) => {
    const customValidationError = validationError.details[1]
        ? validationError.details[1].message
        : validationError.details[0].message;
    return customValidationError;
};

const validateUserRegister = (username, email, password) => {
    try {
        userRegisterZodObject.safeParse({
            username,
            email,
            password,
        });
    } catch (error) {
        const validationError = fromZodError(error);
        return customValidationErrorProvider(validationError);
    }
};

const validateUserLogin = (email, password) => {
    try {
        userLoginZodObject.parse({
            email,
            password,
        });
    } catch (error) {
        const validationError = fromZodError(error);
        return customValidationErrorProvider(validationError);
    }
};

export { validateUserRegister, validateUserLogin };
