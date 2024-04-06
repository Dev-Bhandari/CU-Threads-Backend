import { fromZodError } from "zod-validation-error";

const customValidationErrorProvider = (error) => {
    const validationError = fromZodError(error);
    const customValidationError = validationError.details[1]
        ? validationError.details[1].message
        : validationError.details[0].message;
    return customValidationError;
};

export default customValidationErrorProvider;
