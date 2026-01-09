const Account = require("../../models/account-model");
const Task = require("../../models/task-model");
const paginationHelper = require("../../helpers/pagination");
const searchHelper = require("../../helpers/search");
const { prefixAdmin } = require("../../config/system");

// [GET] /admin/team
module.exports.index = async(req,res) => {
    try {
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        const admin = await Account.findById(account.admin);
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

        res.render("client/pages/team/index",{
            pageTitle: "Thành viên nhóm",
            admin: admin,
            members: members,
            keyword: objectSearch.keyword,
            pagination: objectPagination
        });
    } catch(error) {
        console.error("team index error:", error);
        req.flash("error", "Lỗi khi tải danh sách!");
        res.redirect(req.get('Referrer') || "/team");
    }
}

