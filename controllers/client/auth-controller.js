const Account = require("../../models/account-model");
const md5 = require("md5");

//[GET] /
module.exports.index = async(req,res) => {
    return res.redirect("/login");
}


// [GET] /login
module.exports.login = async(req,res) => {
    if(req.cookies.token){
        return res.redirect("/dashboard");
    } else {
        res.render("client/pages/auth/login",{
            pageTitle: "Đăng nhập"
        });
    }
}

// [POST] /login
module.exports.loginPost = async(req,res) => {
    try {
        if(!req.body.email || !req.body.password){
            req.flash("error", "Vui lòng nhập email và mật khẩu!");
            return res.redirect("/login");
        }

        const account = await Account.findOne({email: req.body.email, role: "member", deleted: false});
        if(!account || account.password !== md5(req.body.password)){
            req.flash("error", "Email hoặc mật khẩu không chính xác!");
            return res.redirect("/login");
        }

        if(account.status === "inactive"){
            req.flash("error", "Tài khoản đã bị khóa!");
            return res.redirect("/login");
        }

        req.session.account = account;
        res.cookie("token", account.token);
        res.redirect("/dashboard");
    } catch(error) {
        console.error("loginPost error:", error);
        req.flash("error", "Lỗi khi đăng nhập!");
        res.redirect("/login");
    }
}

// [GET] /logout
module.exports.logout = async(req,res) => {
    res.clearCookie("token");
    res.redirect("/login");
}
