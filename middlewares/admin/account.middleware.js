const Account = require("../../models/account-model");

module.exports.infoAccount = async (req, res, next) => {
    if(req.cookies.token){
        const account = await Account.findOne({
            token: req.cookies.token,
            deleted: false,
            role: "admin" // Chỉ lấy admin
        });
        if(account){
            res.locals.account = account;
        }
    }
    next();
}
