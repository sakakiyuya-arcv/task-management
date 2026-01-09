const mongoose = require("mongoose");
const nanoid = require("nanoid");

const accountSchema = new mongoose.Schema(
    {
        fullName: String,
        email: {
            type: String,
            unique: true
        },
        password: String,
        token: {
            type: String,
            default: () => nanoid.nanoid(10)
        },
        avatar: String,
        role: String,
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        },
        deleted: {
            type: Boolean,
            default: false
        },
        admin: String,
        deletedAt: Date
    },
    { timestamps: true }
);

const Account = mongoose.model('Account', accountSchema, "accounts");
module.exports = Account;