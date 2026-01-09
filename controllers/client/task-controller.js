const Task = require("../../models/task-model");
const Project = require("../../models/project-model");
const Account = require("../../models/account-model");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const filterStatusHelper = require("../../helpers/filterStatus");
const e = require("express");
const fs = require("fs");
const path = require("path");

// [GET] /tasks
module.exports.index = async(req,res) => {
    try {
        const filterStatus = filterStatusHelper.taskFilter(req.query);
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        let find = {
            deleted: false,
            admin: account.admin,
            $and: [{   
                $or: [
                    { assigned_to: account._id },
                    { participants: account._id }   
                ]
            }]
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

        var check = true;
        if(req.query.assigned_to){
            find.$and[0] = {$or: [{ assigned_to: req.query.assigned_to }, { participants: req.query.assigned_to }]};
            if(String(find.assigned_to) !== String(account._id)){
                check = false;
            }
        }

        let objectSearch = searchHelper(req.query);
        if (req.query.keyword) {
            const regex = objectSearch.regex;
            const projects = await Project.find({ title: regex, deleted: false }).select("_id");
            const projectIds = projects.map(item => item.id);
            const accounts = await Account.find({ fullName: regex, deleted: false }).select("_id");
            const accountIds = accounts.map(item => item.id);

            find.$and.push({
                $or: [
                    { title: regex },                    
                    { project_id: { $in: projectIds } }, 
                    { assigned_to: { $in: accountIds } } 
                ]
            });
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

        res.render("client/pages/task/index",{
            pageTitle: "Danh sách công việc",
            tasks: tasks,
            keyword: objectSearch.keyword,
            filterStatus: filterStatus,
            pagination: objectPagination,
            check: check
        });
    } catch(error) {
        console.error("task index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || "/tasks");
    }
}

// [PATCH] /tasks/change-status/:status/:id
module.exports.changeStatus = async(req,res) => {
    try {
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        const status = req.params.status;
        const id = req.params.id;
        
        const task = await Task.findOne({_id: id, assigned_to: account._id, deleted: false});
        if(!task) {
            return res.status(204).send();
        }
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

// [PATCH] /tasks/change-multi
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

// [GET] /tasks/detail/:id
module.exports.detail = async(req,res) => {
    try {
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        const task = await Task.findOne({_id: req.params.id, deleted: false})
            .populate('project_id')
            .populate('assigned_to')
            .populate('participants');
        if(!task) {
            req.flash("error", "Công việc không tồn tại!");
            return res.redirect(req.get('Referrer'));
        }
        var check = true;
        if(String(task.assigned_to._id) !== String(account._id) && !task.participants.some(participant => String(participant._id) === String(account._id))){
            check = false;
        }
        res.render("client/pages/task/detail",{
            pageTitle: task.title,
            task: task,
            check: check
        });
    } catch(error) {
        console.error("detail error:", error);
        req.flash("error", "Lỗi khi tải chi tiết!");
        res.redirect(req.get('Referrer'));
    }
}

// [POST] /tasks/:id/upload
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

// [DELETE] /tasks/:id/delete-attachment/:index
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
