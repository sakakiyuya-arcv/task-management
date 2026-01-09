const Account = require("../../models/account-model");
const md5 = require("md5");

//[GET] /admin/
module.exports.index = async(req,res) => {
    return res.redirect("/admin/login");
}

// [GET] /admin/register
module.exports.register = async(req,res) => {
    res.render("admin/pages/auth/register",{
        pageTitle: "Đăng ký tài khoản"
    });
}

// [POST] /admin/register
module.exports.registerPost = async(req,res) => {
    try {
        if(!req.body.email || !req.body.password || !req.body.fullName){
            req.flash("error", "Vui lòng điền đầy đủ thông tin!");
            return res.redirect("/admin/register");
        }

        const existAccount = await Account.findOne({email: req.body.email});
        if(existAccount){
            req.flash("error", "Email đã tồn tại!");
            return res.redirect("/admin/register");
        }
        req.body.password = md5(req.body.password);
        const account = new Account(req.body);
        account.role = "admin";
        account.admin = account._id;
        await account.save();
        req.flash("success", "Đăng ký thành công!");
        res.redirect("/admin/login");
    } catch(error) {
        console.error("registerPost error:", error);
        req.flash("error", "Lỗi khi đăng ký!");
        res.redirect("/admin/register");
    }
}

// [GET] /admin/login
module.exports.login = async(req,res) => {
    if(req.cookies.token){
        return res.redirect("/admin/dashboard");
    } else {
        res.render("admin/pages/auth/login",{
            pageTitle: "Đăng nhập"
        });
    }
}

// [POST] /admin/login
module.exports.loginPost = async(req,res) => {
    try {
        if(!req.body.email || !req.body.password){
            req.flash("error", "Vui lòng nhập email và mật khẩu!");
            return res.redirect("/admin/login");
        }

        const account = await Account.findOne({email: req.body.email, role: "admin", deleted: false});
        if(!account || account.password !== md5(req.body.password)){
            req.flash("error", "Email hoặc mật khẩu không chính xác!");
            return res.redirect("/admin/login");
        }

        if(account.status === "inactive"){
            req.flash("error", "Tài khoản đã bị khóa!");
            return res.redirect("/admin/login");
        }

        req.session.account = account;
        res.cookie("token", account.token);
        res.redirect("/admin/dashboard");
    } catch(error) {
        console.error("loginPost error:", error);
        req.flash("error", "Lỗi khi đăng nhập!");
        res.redirect("/admin/login");
    }
}

// [GET] /admin/logout
module.exports.logout = async(req,res) => {
    res.clearCookie("token");
    res.redirect("/admin/login");
}
