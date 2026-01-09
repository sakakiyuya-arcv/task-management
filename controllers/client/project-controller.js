const Project = require("../../models/project-model");
const Task = require("../../models/task-model");
const Account = require("../../models/account-model");
const paginationHelper = require("../../helpers/pagination");
const searchHelper = require("../../helpers/search");
const filterStatusHelper = require("../../helpers/filterStatus");
const e = require("express");

// [GET] /projects
module.exports.index = async(req,res) => {
    try {
        const filterStatus = filterStatusHelper.projectFilter(req.query);
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        const admin = account.admin;
        let find = { 
            deleted: false,
            admin: admin
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

        res.render("client/pages/project/index",{
            pageTitle: "Danh sách dự án",
            projects: projects,
            filterStatus: filterStatus,
            pagination: objectPagination,
            keyword: objectSearch.keyword
        });
    } catch(error) {
        console.error("project index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || "/projects");
    }
}

// [GET] /projects/detail/:id
module.exports.detail = async(req,res) => {
    try {
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        const filterStatus = filterStatusHelper.taskFilter(req.query);
        let find = {
            deleted: false,
            project_id: req.params.id,
            $and : [{
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
        const project = await Project.findOne({_id: req.params.id, deleted: false});
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
        .populate('project_id') 
        .populate('assigned_to');

        res.render("client/pages/project/detail",{
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
        res.redirect(req.get('Referrer') || "/projects");
    }
}
