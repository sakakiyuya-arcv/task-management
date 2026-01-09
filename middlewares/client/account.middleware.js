const Account = require("../../models/account-model");

module.exports.infoAccount = async (req, res, next) => {
    if(req.cookies.token){
        const account = await Account.findOne({
            token: req.cookies.token,
            deleted: false,
            role: "member" // Chỉ lấy member cho client
        });
        if(account){
            res.locals.account = account;
        }
    }
    next();
}
