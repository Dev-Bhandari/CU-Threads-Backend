const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        res.status(error.status_code).json({
            sucess: false,
            message: error.message,
        });
    }
};

export default asyncHandler;
