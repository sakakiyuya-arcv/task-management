const Project = require("../../models/project-model");
const Task = require("../../models/task-model");
const Account = require("../../models/account-model");
const paginationHelper = require("../../helpers/pagination");
const searchHelper = require("../../helpers/search");
const filterStatusHelper = require("../../helpers/filterStatus");
const { prefixAdmin } = require("../../config/system");
const e = require("express");

// [GET] /admin/projects
module.exports.index = async(req,res) => {
    try {
        const filterStatus = filterStatusHelper.projectFilter(req.query);
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        let find = { 
            deleted: false,
            admin: admin._id
        };
      
        if(req.query.status){
            if(req.query.status == "overdue"){
                find.overdue = true;
            } else if(req.query.status != "all"){
                find.status = req.query.status;
            }
        } else{
            find.status = "in-progress";
        }
      
        let objectSearch = searchHelper(req.query);
        if (req.query.keyword) {
            const regex = objectSearch.regex;
            find.$or = [
                { title: regex },                    
                { description: regex }
            ];
        }

        const countProjects = await Project.countDocuments(find).maxTimeMS(15000);
        let objectPagination = paginationHelper(
            { currentPage: 1, limititems: 6 },
            req.query,
            countProjects
        );

        let projects = await Project.find(find)
            .limit(objectPagination.limititems)
            .skip(objectPagination.skip)
            .maxTimeMS(15000);

        // projects = await Promise.all(
        //     projects.map(async (project) => {
        //         if(project.status !== "on-hold"){
        //             const [completedTasks, totalTasks] = await Promise.all([
        //                 Task.countDocuments({project_id: project._id, deleted: false, status: "done"}),
        //                 Task.countDocuments({project_id: project._id, deleted: false})
        //             ]);
                    
        //             const newStatus = (completedTasks === totalTasks && totalTasks > 0) ? "completed" : "in-progress";
        //             if(project.status !== newStatus){
        //                 await Project.updateOne({_id: project._id}, {status: newStatus});
        //                 project.status = newStatus;
        //             }
        //         }
        //         return project;
        //     })
        // );

        res.render("admin/pages/project/index",{
            pageTitle: "Danh sách dự án",
            projects: projects,
            filterStatus: filterStatus,
            pagination: objectPagination,
            keyword: objectSearch.keyword
        });
    } catch(error) {
        console.error("project index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || prefixAdmin+"/projects");
    }
}

// [GET] /admin/projects/create
module.exports.create = async(req,res) => {
    const returnUrl = req.get("Referer") || "/admin/projects";
    res.render("admin/pages/project/create",{
        pageTitle: "Thêm dự án mới",
        returnUrl: returnUrl
    });
}

// [POST] /admin/projects/create
module.exports.createPost = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        if(!req.body.title){
            req.flash("error", "Tiêu đề không được để trống!");
            return res.redirect(prefixAdmin+"/projects/create");
        }

        const project = new Project(req.body);
        project.admin = admin.id;
        await project.save();
        req.flash("success", "Thêm dự án thành công!");
        res.redirect(req.body.returnUrl || prefixAdmin+"/projects");
    } catch(error) {
        console.error("createPost error:", error);
        req.flash("error", "Lỗi khi thêm dự án!");
        res.redirect(prefixAdmin+"/projects/create");
    }
}

// [GET] /admin/projects/edit/:id
module.exports.edit = async(req,res) => {
    try {
        const returnUrl = req.get("Referer") || "/admin/projects";
        const project = await Project.findOne({_id: req.params.id, deleted: false});
        if(!project) {
            req.flash("error", "Dự án không tồn tại!");
            return res.redirect(req.get('Referrer'));
        }
        res.render("admin/pages/project/edit",{
            pageTitle: "Chỉnh sửa dự án",
            project: project,
            returnUrl: returnUrl
        });
    } catch(error) {
        console.error("edit error:", error);
        req.flash("error", "Có lỗi xảy ra!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/projects/edit/:id
module.exports.editPatch = async(req,res) => {
    try {
        const id = req.params.id;
        
        await Project.updateOne({_id: id}, req.body);
        req.flash("success", "Cập nhật dự án thành công!");
        res.redirect(req.body.returnUrl || prefixAdmin+"/projects");
    } catch(error) {
        console.error("editPatch error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [DELETE] /admin/projects/delete/:id
module.exports.delete = async(req,res) => {
    try {
        const id = req.params.id;
        await Project.updateOne({_id: id}, {deleted: true, deletedAt: new Date()});
        await Task.updateMany({project_id: id}, {deleted: true, deletedAt: new Date()});
        req.flash("success", "Xóa dự án thành công!");
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("delete error:", error);
        req.flash("error", "Lỗi khi xóa!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/projects/change-status/:status/:id
module.exports.changeStatus = async(req,res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;
        const project = await Project.findOne({_id: id, deleted: false});
        if(req.params.status != project.status){ 
            await Project.updateOne({_id: id},{status: status});
            if(status == "in-progress"){
                const allTasks = await Task.countDocuments({project_id: id, deleted: false});
                const allDoneTasks = await Task.countDocuments({project_id: id, deleted: false, status: "done"});
                if(allDoneTasks==allTasks&&allTasks>0){
                    await Project.updateOne({_id: id},{status: "completed"});
                }
            }
            req.flash("success", `Cập nhật trạng thái thành công!`);
            res.redirect(req.get('Referrer'));
        }
    } catch(error) {
        console.error("changeStatus error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/projects/change-multi
module.exports.changeMulti = async(req,res) => {
    try {
        const type = req.body.type;
        let ids = req.body.ids.split(", ").filter(id => id.trim() !== "");
        
        if(ids.length === 0) {
            req.flash("error", "Vui lòng chọn dự án!");
            return res.redirect(req.get('Referrer'));
        }
        
        switch(type){
            case "in-progress":
                await Project.updateMany({_id: {$in: ids}},{status: "in-progress"});
                req.flash("success", `Cập nhật ${ids.length} dự án thành công!`);
                break;
            case "on-hold":
                await Project.updateMany({_id: {$in: ids}},{status: "on-hold"});
                req.flash("success", `Cập nhật ${ids.length} dự án thành công!`);
                break;
            // case "completed":
            //     await Project.updateMany({_id: {$in: ids}},{status: "completed"});
            //     req.flash("success", `Cập nhật ${ids.length} dự án thành công!`);
            //     break;
            case "delete-all":
                await Project.updateMany({_id: {$in: ids}},{deleted: true, deletedAt: new Date()});
                await Task.updateMany({project_id: {$in: ids}},{deleted: true, deletedAt: new Date()});
                req.flash("success", `Đã xóa ${ids.length} dự án thành công!`);
                break;
            default:
                break;
        }
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("changeMulti error:", error);
        req.flash("error", "Có lỗi xảy ra!");
        res.redirect(req.get('Referrer'));
    }
}

// [GET] /admin/projects/detail/:id
module.exports.detail = async(req,res) => {
    try {
        const filterStatus = filterStatusHelper.taskFilter(req.query);
        let find = {
            deleted: false,
            project_id: req.params.id
        };

        if(req.query.status){
            if(req.query.status == "overdue"){
                find.overdue = true;
                find.status = { $ne: "done" };
            } else if(req.query.status != "all"){
                find.status = req.query.status;
            }
        } else{
            find.status = { $in: ["todo", "in-progress"] };
        }

        let objectSearch = searchHelper(req.query);
        if (req.query.keyword) {
            const regex = objectSearch.regex;
            const projects = await Project.find({ title: regex, deleted: false }).select("_id");
            const projectIds = projects.map(item => item.id);
            const accounts = await Account.find({ fullName: regex, deleted: false }).select("_id");
            const accountIds = accounts.map(item => item.id);
            find.$or = [
                { title: regex },                    
                { project_id: { $in: projectIds } }, 
                { assigned_to: { $in: accountIds } } 
            ];
        }
        const project = await Project.findOne({_id: req.params.id, deleted: false});
        const countTasks = await Task.countDocuments({project_id: project._id, deleted: false}).maxTimeMS(15000);
        
        let objectPagination = paginationHelper(
            {
                currentPage: 1,
                limititems: 6
            },
            req.query,
            countTasks
        );

        const tasks = await Task.find(find)
        .limit(objectPagination.limititems)
        .skip(objectPagination.skip)
        .populate('project_id') 
        .populate('assigned_to');

        res.render("admin/pages/project/detail",{
            pageTitle: project.title,
            project: project,
            tasks: tasks,
            filterStatus: filterStatus,
            keyword: objectSearch.keyword,
            pagination: objectPagination
        });
    } catch(error) {
        console.error("task index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || prefixAdmin+"/projects");
    }
}

// [GET] /admin/projects/:id/createTask
module.exports.createTask = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        const project = await Project.findOne({deleted: false, _id: req.params.id});
        const returnUrl = req.get("Referer") || prefixAdmin+`/projects/detail/${project._id}`;
        if(project.status=="on-hold"){
            req.flash("error", "Không thể thêm công việc do dự án đang tạm dừng!");
            return res.redirect(req.get('Referrer'));
        }
        const members = await Account.find({deleted: false, admin: admin._id});
        res.render("admin/pages/project/create-task",{
            pageTitle: "Thêm công việc mới",
            project: project,
            members: members,
            returnUrl: returnUrl
        });
    } catch(error) {
        console.error("create error:", error);
        req.flash("error", "Lỗi khi tải trang!");
        res.redirect(req.get('Referrer'));
    }
}

// [POST] /admin/projects/:id/createTask
module.exports.createTaskPost = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        const project = await Project.findOne({deleted: false, _id: req.params.id});
        if(!req.body.title){
            req.flash("error", "Tiêu đề không được để trống!");
            return res.redirect(prefixAdmin+"/projects/"+project._id+"/createTask");
        }
        
        if(req.body.assigned_to === "") {
            req.body.assigned_to = null;
        }

        const task = new Task(req.body);
        task.admin = admin._id;
        task.project_id = project._id;
        await task.save();
        req.flash("success", "Thêm công việc thành công!");
        res.redirect(req.body.returnUrl || prefixAdmin+`/projects/detail/${project._id}`);
    } catch(error) {
        console.error("createPost error:", error);
        req.flash("error", "Lỗi khi thêm công việc!");
        res.redirect(prefixAdmin+"/projects/"+project._id+"/createTask");
    }
}