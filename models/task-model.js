const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: String,
        description: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo"
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },
        project_id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            default: null
        },
        assigned_to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null
        },
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account"
        }],
        due_date: Date,
        done_date: {
            type: Date,
            default: null
        },
        overdue: {
            type: Boolean,
            default: false
        },
        admin: String,
        deleted: {
            type: Boolean,
            default: false
        },
        attachments: [
            {
                filename: String,
                url: String,
                size: Number,
                uploadedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
        deletedAt: Date
    },
    { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema, "tasks");
module.exports = Task;
