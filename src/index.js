import { connectDB, PORT } from "./config/index.js";
import { app } from "./app.js";

connectDB().then(() => {
    app.listen(() => {
        console.log(`Server running on port ${PORT}`);
    });
});
