const Task = require("../../models/task-model");
const Project = require("../../models/project-model");
const Account = require("../../models/account-model");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const filterStatusHelper = require("../../helpers/filterStatus");
const { prefixAdmin } = require("../../config/system");
const e = require("express");
const fs = require("fs");
const path = require("path");

// [GET] /admin/tasks
module.exports.index = async(req,res) => {
    try {  
        const filterStatus = filterStatusHelper.taskFilter(req.query);
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        let find = {
            deleted: false,
            admin: admin._id
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

        let andConditions = [];

        if (req.query.assigned_to) {
            andConditions.push({
                $or: [
                    { assigned_to: req.query.assigned_to }, 
                    { participants: req.query.assigned_to } 
                ]
            });
        }

        let objectSearch = searchHelper(req.query);
        if (req.query.keyword) {
            const regex = objectSearch.regex;
            const projects = await Project.find({ title: regex, deleted: false }).select("_id");
            const projectIds = projects.map(item => item.id);
            const accounts = await Account.find({ fullName: regex, deleted: false }).select("_id");
            const accountIds = accounts.map(item => item.id);

            andConditions.push({
                $or: [
                    { title: regex },                    
                    { project_id: { $in: projectIds } }, 
                    { assigned_to: { $in: accountIds } } 
                ]
            });
        }

        if (andConditions.length > 0) {
            find.$and = andConditions;
        }

        const countTasks = await Task.countDocuments(find).maxTimeMS(15000);
        
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
        // Tăng tốc: Lệnh này sẽ tự động "join" tên Project vào
        .populate('project_id') 
        .populate('assigned_to')
        .populate('participants')

// Lúc này, item.project_id.title đã có sẵn tên Project, bạn không cần vòng lặp nữa.

        // const newTasks = await Promise.all(
        //     tasks.map(async (item) => {
        //         if(item.project_id){
        //             const project = await Project.findOne({_id: item.project_id, deleted: false});
        //             item.project = project ? project.title : "";
        //         } else {
        //             item.project = "";
        //         }
        //         if(item.assigned_to){
        //             const member = await Account.findOne({_id: item.assigned_to, deleted: false});
        //             item.assigned_to = member ? member.fullName : "";
        //         } else {
        //             item.assigned_to = "";
        //         }
        //         return item;
        //     })
        // );

        res.render("admin/pages/task/index",{
            pageTitle: "Danh sách công việc",
            tasks: tasks,
            keyword: objectSearch.keyword,
            filterStatus: filterStatus,
            pagination: objectPagination
        });
    } catch(error) {
        console.error("task index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || prefixAdmin+"/tasks");
    }
}

// [GET] /admin/tasks/create
module.exports.create = async(req,res) => {
    try {
        const returnUrl = req.get("Referer") || "/admin/tasks";
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        const projects = await Project.find({deleted: false, status: "in-progress", admin: admin._id});
        const members = await Account.find({deleted: false, admin: admin._id});
        res.render("admin/pages/task/create",{
            pageTitle: "Thêm công việc mới",
            projects: projects,
            members: members,
            returnUrl: returnUrl
        });
    } catch(error) {
        console.error("create error:", error);
        req.flash("error", "Lỗi khi tải trang!");
        res.redirect(req.get('Referrer'));
    }
}

// [POST] /admin/tasks/create
module.exports.createPost = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        if(!req.body.title){
            req.flash("error", "Tiêu đề không được để trống!");
            return res.redirect(prefixAdmin+"/tasks/create");
        }

        if(req.body.project_id === "") {
            req.body.project_id = null;
        }
        
        if(req.body.assigned_to === "") {
            req.body.assigned_to = null;
        }

        if(!req.body.participants) {
            req.body.participants = [];
        }

        const task = new Task(req.body);
        task.admin = admin._id;
        await task.save();
        req.flash("success", "Thêm công việc thành công!");
        const urlRedirect = req.body.returnUrl || "/admin/tasks";
        res.redirect(urlRedirect);
    } catch(error) {
        console.error("createPost error:", error);
        req.flash("error", "Lỗi khi thêm công việc!");
        res.redirect(prefixAdmin+"/tasks/create");
    }
}

// [GET] /admin/tasks/edit/:id
module.exports.edit = async(req,res) => {
    try {
        const returnUrl = req.get("Referer") || "/admin/tasks";
        const task = await Task.findOne({_id: req.params.id, deleted: false})
            .populate('project_id')
            .populate('assigned_to')
            .populate('participants');
        if(!task) {
            req.flash("error", "Công việc không tồn tại!");
            return res.redirect(req.get('Referrer'));
        }
        if(task.project_id&&task.project_id.status=="on-hold") {
            req.flash("error", "Không thể chỉnh sửa công việc do dự án tạm dừng!");
            return res.redirect(req.get('Referrer'));
        }
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        const projects = await Project.find({deleted: false, status: "in-progress", admin: admin._id});
        const members = await Account.find({deleted: false, admin: admin._id});
        res.render("admin/pages/task/edit",{
            pageTitle: "Chỉnh sửa công việc",
            task: task,
            projects: projects,
            members: members,
            returnUrl: returnUrl
        });
    } catch(error) {
        console.error("edit error:", error);
        req.flash("error", "Có lỗi xảy ra!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/tasks/edit/:id
module.exports.editPatch = async(req,res) => {
    try {
        const id = req.params.id;
        const task = await Task.findOne({_id: id, deleted: false})
        if(req.body.project_id === "") {
            req.body.project_id = null;
        }
        if(req.body.assigned_to === "") {
            req.body.assigned_to = null;
        }
        if(!req.body.participants) {
            req.body.participants = [];
        }
        if(req.body.status == "done") {
            if(task.status != "done")
            req.body.done_date = new Date(); 
        } else {
            req.body.done_date = null; 
        }
        await Task.updateOne({_id: id}, req.body);
        req.flash("success", "Cập nhật công việc thành công!");

        const urlRedirect = req.body.returnUrl || "/admin/tasks";
        res.redirect(urlRedirect);
    } catch(error) {
        console.error("editPatch error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [DELETE] /admin/tasks/delete/:id
module.exports.delete = async(req,res) => {
    try {
        const id = req.params.id;
        const task = await Task.findOne({_id: id, deleted: false})
            .populate('project_id');
        if(task.project_id&&task.project_id.status=="on-hold") {
            req.flash("error", "Không thể xóa công việc do dự án tạm dừng!");
            return res.redirect(req.get('Referrer'));
        }
        await Task.updateOne({_id: id}, {deleted: true, deletedAt: new Date()});
        req.flash("success", "Xóa công việc thành công!");
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("delete error:", error);
        req.flash("error", "Lỗi khi xóa!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/tasks/change-status/:status/:id
module.exports.changeStatus = async(req,res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;
        
        const task = await Task.findOne({_id: id, deleted: false});
        const project = await Project.findOne({_id: task.project_id, deleted: false});
        if(project&&project.status=="on-hold"){
            req.flash("error", "Không thể cập nhật trạng thái do dự án tạm dừng!");
            return res.redirect(req.get('Referrer'));
        }
        if(status == "done") {
            if(task.status != "done")
                await Task.updateOne({_id: id},{done_date: new Date()}); 
        } else {
            await Task.updateOne({_id: id},{done_date: null}); 
        }
        await Task.updateOne({_id: id},{status: status});
        if(project&&project.status!="on-hold"){
            const allTasks = await Task.countDocuments({project_id: project._id, deleted: false});
            const allDone = await Task.countDocuments({project_id: project._id, deleted: false, status: "done"});
            const newStatus = (allDone == allTasks && allTasks > 0) ? "completed" : "in-progress";
            if(project.status != newStatus){
                await Project.updateOne({_id: project._id}, {status: newStatus});
            }
        }
        req.flash("success", `Cập nhật trạng thái thành công!`);
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("changeStatus error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/tasks/change-multi
module.exports.changeMulti = async(req,res) => {
    try {
        const type = req.body.type;
        let ids = req.body.ids.split(", ").filter(id => id.trim() !== "");

        // console.log(ids);
        // console.log(type);
        const projectIds = await Task.distinct('project_id', {
            _id: { $in: ids }
        });
        
        if(ids.length === 0) {
            req.flash("error", "Vui lòng chọn công việc!");
            return res.redirect(req.get('Referrer'));
        }
        
        switch(type){
            case "todo":
                await Task.updateMany({_id: {$in: ids}},{status: "todo"});
                req.flash("success", `Cập nhật ${ids.length} công việc thành công!`);
                break;
            case "in-progress":
                await Task.updateMany({_id: {$in: ids}},{status: "in-progress"});
                req.flash("success", `Cập nhật ${ids.length} công việc thành công!`);
                break;
            case "done":
                const tasks = await Task.find({_id: {$in: ids}, deleted: false});
                for(const task of tasks){
                    if(task.status != "done"){
                        await Task.updateOne({_id: task._id},{done_date: new Date()});
                    } 
                }
                await Task.updateMany({_id: {$in: ids}},{status: "done"});
                req.flash("success", `Cập nhật ${ids.length} công việc thành công!`);
                break;
            case "delete-all":
                await Task.updateMany({_id: {$in: ids}},{deleted: true, deletedAt: new Date()});
                req.flash("success", `Đã xóa ${ids.length} công việc thành công!`);
                break;
            default:
                break;
        }

        if(projectIds.length > 0){
            projectIds.forEach(async item => {
                const project = await Project.findOne({_id: item, deleted: false});
                if(project&&project.status!="on-hold"){
                    const allTasks = await Task.countDocuments({project_id: project._id, deleted: false});
                    const allDone = await Task.countDocuments({project_id: project._id, deleted: false, status: "done"});
                    const newStatus = (allDone == allTasks && allTasks > 0) ? "completed" : "in-progress";
                    if(project.status != newStatus){
                        await Project.updateOne({_id: project._id}, {status: newStatus});
                    }
                }
            });
        }
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("changeMulti error:", error);
        req.flash("error", "Có lỗi xảy ra!");
        res.redirect(req.get('Referrer'));
    }
}

// [GET] /admin/tasks/detail/:id
module.exports.detail = async(req,res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, deleted: false})
            .populate('project_id')
            .populate('assigned_to')
            .populate('participants');
        if(!task) {
            req.flash("error", "Công việc không tồn tại!");
            return res.redirect(req.get('Referrer'));
        }

        res.render("admin/pages/task/detail",{
            pageTitle: task.title,
            task: task
        });
    } catch(error) {
        console.error("detail error:", error);
        req.flash("error", "Lỗi khi tải chi tiết!");
        res.redirect(req.get('Referrer'));
    }
}

// [POST] /admin/tasks/:id/upload
module.exports.upload = async(req,res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, deleted: false}).populate('project_id');

        if(!task){
            return res.status(404).json({
                success: false, 
                error: "Công việc không tồn tại"
            });
        }

        if(task.project_id && task.project_id.status == "on-hold"){
            return res.json({
                success: false,
                error: "Không thể tải lên do dự án tạm dừng!"
            });
        }

        if(!req.file){
            return res.status(400).json({error: "Chưa chọn file"});
        }

        const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
        
        const attachment = {
            filename: originalFilename, 
            url: `/uploads/${encodeURIComponent(req.file.filename)}`, 
            size: req.file.size,
            uploadedAt: new Date()
        };

        task.attachments.push(attachment);
        await task.save();

        res.json({
            success: true,
            message: "Upload file thành công!",
            attachment: attachment
        });
    } catch(error) {
        console.error("upload error:", error);
        res.status(500).json({error: "Lỗi upload file"});
    }
}

// [DELETE] /admin/tasks/:id/delete-attachment/:index
module.exports.deleteAttachment = async(req,res) => {
    try {
        const task = await Task.findOne({_id: req.params.id, deleted: false})

        if(task.project_id&&task.project_id.status=="on-hold"){
            req.flash("error", "Không thể xóa file do dự án tạm dừng!");
            return res.redirect(req.get('Referrer'));
        }

        if(!task){
            return res.status(404).json({error: "Công việc không tồn tại"});
        }

        const index = parseInt(req.params.index, 10);
        if(Number.isNaN(index) || index < 0 || index >= task.attachments.length){
            return res.status(400).json({error: "Index không hợp lệ"});
        }

        const attachment = task.attachments[index];
        if(attachment && attachment.url){
            const rel = attachment.url.startsWith("/") ? attachment.url.slice(1) : attachment.url;
            const filePath = path.join(process.cwd(), rel);
            fs.unlink(filePath, (err) => {
                if(err && err.code !== 'ENOENT'){
                    console.error("Lỗi xóa file:", err);
                }
            });
        }

        task.attachments.splice(index, 1);
        await task.save();

        res.json({success: true, message: "Xóa file thành công"});
    } catch(error) {
        console.error("deleteAttachment error:", error);
        res.status(500).json({error: "Lỗi xóa file"});
    }
}
