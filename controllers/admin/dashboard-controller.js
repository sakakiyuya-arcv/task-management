const Task = require("../../models/task-model");
const Project = require("../../models/project-model");
const Account = require("../../models/account-model");

// [GET] /admin/dashboard
module.exports.index = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        
        const totalTasks = await Task.countDocuments({deleted: false, admin: admin._id});
        const completedTasks = await Task.countDocuments({deleted: false, status: "done", admin: admin._id});
        const inProgressTasks = await Task.countDocuments({deleted: false, status: "in-progress", admin: admin._id});
        const todoTasks = await Task.countDocuments({deleted: false, status: "todo", admin: admin._id});
        const overdueTasks = await Task.countDocuments({deleted: false, overdue: true, admin: admin._id});

        const totalProjects = await Project.countDocuments({deleted: false, admin: admin._id});
        const completedProjects = await Project.countDocuments({deleted: false, status: "completed", admin: admin._id});
        const inProgressProjects = await Project.countDocuments({deleted: false, status: "in-progress", admin: admin._id});
        const onHoldProjects = await Project.countDocuments({deleted: false, status: "on-hold", admin: admin._id});
        const overdueProjects = await Project.countDocuments({deleted: false, overdue: true, admin: admin._id});

        res.render("admin/pages/dashboard/index",{
            pageTitle: "Dashboard",
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            overdueTasks,
            totalProjects,
            completedProjects,
            inProgressProjects,
            onHoldProjects,
            overdueProjects
        });
    } catch(error) {
        console.error("dashboard error:", error);
        req.flash("error", "Lỗi khi tải dashboard!");
        res.redirect("/");
    }
}
