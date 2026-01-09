const Account = require("../../models/account-model");
const md5 = require("md5");
const fs = require("fs");
const path = require("path");

//[GET] /profile
module.exports.index = async(req,res) => {
    try {
        const account = await Account.findOne({token: req.cookies.token, deleted: false});
        res.render("client/pages/profile/index",{
            pageTitle: "Thông tin cá nhân",
            account: account
        });
    } catch(error) {
        console.error("Profile index error:", error);
        req.flash("error", "Lỗi khi tải thông tin cá nhân!");
        res.redirect("/dashboard");
    }
}

//[GET] /profile/edit/:id
module.exports.edit = async(req,res) => {
    try {   
        const account = await Account.findOne({_id: req.params.id, deleted: false});
        res.render("client/pages/profile/edit",{
            pageTitle: "Chỉnh sửa thông tin cá nhân",
            account: account
        });
    } catch(error) {
        console.error("Profile edit error:", error);
        req.flash("error", "Lỗi khi tải trang chỉnh sửa thông tin cá nhân!");
        res.redirect("/profile");
    }
}

//[PATCH] /profile/edit/:id
module.exports.editPatch = async(req,res) => {
    try {
        if(!req.body) {
            req.flash("error", "Dữ liệu không hợp lệ!");
            return res.redirect(`/profile/edit/${req.params.id}`);
        }

        const updateData = {
            fullName: req.body.fullName || "",
            email: req.body.email || ""
        };

        // Nếu có upload avatar mới
        if(req.file) {
            // Lấy thông tin account cũ để xóa ảnh cũ
            const oldAccount = await Account.findOne({ _id: req.params.id, deleted: false });
            
            // Xóa ảnh cũ nếu có
            if(oldAccount && oldAccount.avatar) {
                const oldAvatarPath = oldAccount.avatar.startsWith("/") 
                    ? oldAccount.avatar.slice(1) 
                    : oldAccount.avatar;
                const filePath = path.join(process.cwd(), "public", oldAvatarPath);
                
                fs.unlink(filePath, (err) => {
                    if(err && err.code !== 'ENOENT'){
                        console.error("Lỗi xóa ảnh cũ:", err);
                    }
                });
            }
            
            // Cập nhật avatar mới
            updateData.avatar = req.file.path;
        }

        await Account.updateOne(
            { _id: req.params.id, deleted: false },
            updateData
        );
        
        req.flash("success", "Cập nhật thông tin cá nhân thành công!");
        res.redirect("/profile");
    } catch(error) {
        console.error("Profile edit patch error:", error);
        req.flash("error", "Lỗi khi cập nhật thông tin cá nhân!");
        res.redirect(`/profile/edit/${req.params.id}`);
    }
}

//[GET] /profile/change-password/:id
module.exports.changePassword = async(req,res) => {
    try {
        const account = await Account.findOne({_id: req.params.id, deleted: false});
        res.render("client/pages/profile/change-password",{
            pageTitle: "Đổi mật khẩu",
            account: account
        });
    } catch(error) {
        console.error("Profile change password error:", error);
        req.flash("error", "Lỗi khi tải trang đổi mật khẩu!");
        res.redirect("/profile");
    }
}

//[PATCH] /profile/change-password/:id
module.exports.changePasswordPatch = async(req,res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const account = await Account.findOne({_id: req.params.id, deleted: false});
        
        if(account.password !== md5(currentPassword)) {
            req.flash("error", "Mật khẩu hiện tại không đúng!");
            return res.redirect(`/profile/change-password/${req.params.id}`);
        }
        if(newPassword !== confirmPassword) {
            req.flash("error", "Mật khẩu mới và xác nhận mật khẩu mới không khớp!");
            return res.redirect(`/profile/change-password/${req.params.id}`);
        }
        
        await Account.updateOne(
            { _id: req.params.id, deleted: false },
            { password: md5(newPassword) }
        );
        req.flash("success", "Đổi mật khẩu thành công!");
        res.redirect("/profile");
    } catch(error) {
        console.error("Profile change password patch error:", error);
        req.flash("error", "Lỗi khi đổi mật khẩu!");
        res.redirect(`/profile/change-password/${req.params.id}`);
    }
}