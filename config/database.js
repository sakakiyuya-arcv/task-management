const mongoose = require("mongoose");

module.exports.connect = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
}
