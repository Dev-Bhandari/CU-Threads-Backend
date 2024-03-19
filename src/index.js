import { PORT } from "./config/server.config.js";
import connectDB from "./config/database.config.js";
import { app } from "./app.js";

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
