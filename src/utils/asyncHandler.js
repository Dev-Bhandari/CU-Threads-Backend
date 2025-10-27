const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.statusCode).json({
            sucess: false,
            message: error.message,
        });
    }
};

export default asyncHandler;
