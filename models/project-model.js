const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        status: {
            type: String,
            enum: ["in-progress", "on-hold", "completed"],
            default: "in-progress"
        },
        deleted: {
            type: Boolean,
            default: false
        },
        admin: String,
        due_date: Date,
        overdue: {
            type: Boolean,
            default: false
        },
        deletedAt: Date
    },
    { timestamps: true }
);

const Project = mongoose.model('Project', projectSchema, "projects");
module.exports = Project;
