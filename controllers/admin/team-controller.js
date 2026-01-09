const Account = require("../../models/account-model");
const Task = require("../../models/task-model");
const md5 = require("md5");
const paginationHelper = require("../../helpers/pagination");
const searchHelper = require("../../helpers/search");
const { prefixAdmin } = require("../../config/system");

// [GET] /admin/team
module.exports.index = async(req,res) => {
    try {
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        let find = { 
            deleted: false,
            role: "member",
            admin: admin._id
        };
        let objectSearch = searchHelper(req.query);
        if(objectSearch.regex){
            find.fullName = objectSearch.regex;
        }

        let showAdmin = true;
        if (req.query.keyword) {
            const regex = new RegExp(req.query.keyword, "i");
            if (!regex.test(admin.fullName)) {
                showAdmin = false;
            }
        }
   
        const countMembers = await Account.countDocuments(find).maxTimeMS(15000);
        let objectPagination = paginationHelper(
            { currentPage: 1, limititems: 6 },
            req.query,
            showAdmin ? countMembers + 1 : countMembers
        );
        let currentPage = parseInt(req.query.page) || 1;

        const members = await Account.find(find)
            .sort({createdAt: "desc"})
            .limit(showAdmin && currentPage === 1 ? objectPagination.limititems - 1 : objectPagination.limititems)
            .skip(showAdmin && !(currentPage === 1) ? objectPagination.skip - 1 : objectPagination.skip)
            .maxTimeMS(15000);

        if (objectPagination.currentPage==1 && showAdmin) {
            members.unshift(admin);
        }

        res.render("admin/pages/team/index",{
            pageTitle: "Quản lý thành viên",
            admin: admin,
            members: members,
            keyword: objectSearch.keyword,
            pagination: objectPagination
        });
    } catch(error) {
        console.error("team index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || prefixAdmin+"/team");
    }
}

// [GET] /admin/team/create
module.exports.create = async(req,res) => {
    res.render("admin/pages/team/create",{
        pageTitle: "Thêm thành viên"
    });
}

// [POST] /admin/team/create
module.exports.createPost = async(req,res) => {
    try {
        if(!req.body.email || !req.body.password || !req.body.fullName){
            req.flash("error", "Vui lòng điền đầy đủ thông tin!");
            return res.redirect("/admin/team/create");
        }

        const existAccount = await Account.findOne({email: req.body.email});
        if(existAccount){
            req.flash("error", "Email đã tồn tại!");
            return res.redirect("/admin/team/create");
        }
        const admin = await Account.findOne({token: req.cookies.token, deleted: false});
        req.body.password = md5(req.body.password);
        const account = new Account(req.body);
        account.role = "member";
        account.admin = admin._id;
        await account.save();
        req.flash("success", "Đã thêm thành viên mới!");
        res.redirect("/admin/team");
    } catch(error) {
        console.error("registerPost error:", error);
        req.flash("error", "Lỗi khi thêm thành viên!");
        res.redirect("/admin/team/create");
    }
}

// [GET] /admin/team/edit/:id
module.exports.edit = async(req,res) => {
    try {
        const member = await Account.findOne({_id: req.params.id, deleted: false});
        if(!member) {
            req.flash("error", "Thành viên không tồn tại!");
            return res.redirect(req.get('Referrer'));
        }
        res.render("admin/pages/team/edit",{
            pageTitle: "Chỉnh sửa thành viên",
            member: member
        });
    } catch(error) {
        console.error("edit error:", error);
        req.flash("error", "Có lỗi xảy ra!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/team/edit/:id
module.exports.editPatch = async(req,res) => {
    try {
        const id = req.params.id;
        if(req.body.password && req.body.password.trim() !== "") {
            req.body.password = md5(req.body.password);
        }
        await Account.updateOne({_id: id}, req.body);
        req.flash("success", "Cập nhật thành viên thành công!");
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("editPatch error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/team/change-status/:status/:id
module.exports.changeStatus = async(req,res) => {
    try {
        const status = req.params.status;
        const id = req.params.id;
        
        await Account.updateOne({_id: id},{status: status});
        req.flash("success", `Cập nhật trạng thái thành công!`);
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("changeStatus error:", error);
        req.flash("error", "Lỗi khi cập nhật!");
        res.redirect(req.get('Referrer'));
    }
}

// [DELETE] /admin/team/delete/:id
module.exports.delete = async(req,res) => {
    try {
        const id = req.params.id;
        await Account.updateOne({_id: id}, {deleted: true, deletedAt: new Date()});
        await Task.updateMany({assigned_to: id}, {assigned_to: null});
        req.flash("success", "Xóa thành viên thành công!");
        res.redirect(req.get('Referrer'));
    } catch(error) {
        console.error("delete error:", error);
        req.flash("error", "Lỗi khi xóa!");
        res.redirect(req.get('Referrer'));
    }
}

// [PATCH] /admin/team/change-multi
module.exports.changeMulti = async(req,res) => {
    try {
        const type = req.body.type;
        let ids = req.body.ids.split(", ").filter(id => id.trim() !== "");
        
        if(ids.length === 0) {
            req.flash("error", "Vui lòng chọn thành viên!");
            return res.redirect(req.get('Referrer'));
        }
        
        switch(type){
            case "active":
                await Account.updateMany({_id: {$in: ids}},{status: "active"});
                req.flash("success", `Cập nhật ${ids.length} thành viên thành công!`);
                break;
            case "inactive":
                await Account.updateMany({_id: {$in: ids}},{status: "inactive"});
                req.flash("success", `Cập nhật ${ids.length} thành viên thành công!`);
                break;
            case "delete-all":
                await Account.updateMany({_id: {$in: ids}},{deleted: true, deletedAt: new Date()});
                req.flash("success", `Đã xóa ${ids.length} thành viên thành công!`);
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
