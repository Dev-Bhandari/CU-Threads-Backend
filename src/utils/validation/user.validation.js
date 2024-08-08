import zod from "zod";
import customValidationErrorProvider from "./index.validation.js";

const username = zod
    .string()
    .min(3, { message: "Username should be of minimum 3 characters" })
    .refine((s) => !s.includes(" "), "Username should not contain spaces")
    .refine((value) => {
        const regex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
        return !regex.test(value);
    }, "Username should not contain symbols");

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

const validateUserRegister = (username, email, password) => {
    try {
        userRegisterZodObject.parse({
            username,
            email,
            password,
        });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

const validateUserLogin = (email, password) => {
    try {
        userLoginZodObject.parse({
            email,
            password,
        });
    } catch (error) {
        return customValidationErrorProvider(error);
    }
};

export { validateUserRegister, validateUserLogin };
