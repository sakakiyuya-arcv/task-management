const systemConfig = require("../../config/system");
const Account = require("../../models/account-model");

module.exports.requireAuth = async (req, res, next) => {
  if (!req.cookies.token) {
    res.redirect(`${systemConfig.prefixAdmin}/login`);
    return;
  }

  const user = await Account.findOne({
    token: req.cookies.token,
    deleted: false,
    role: "admin"
  }).select("-password");

  if (!user) {
    res.clearCookie("token");
    res.redirect(`${systemConfig.prefixAdmin}/login`);
    return;
  }

  res.locals.user = user; 
  res.locals.role = user.role;

  next();
};