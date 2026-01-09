const taskRoute = require("./task-route");
const projectRoute = require("./project-route");
const dashboardRoute = require("./dashboard-route");
const authRoute = require("./auth-route");
const teamRoute = require("./team-route");
const authMiddleware = require('../../middlewares/admin/auth-middleware')
const profileRoute = require("./profile-route");
const accountMiddleware = require("../../middlewares/admin/account.middleware");
const { prefixAdmin } = require("../../config/system");

module.exports = (app) => {
    app.use(accountMiddleware.infoAccount); // Middleware cho tất cả admin routes
    app.use(prefixAdmin + "/dashboard", authMiddleware.requireAuth, dashboardRoute);
    app.use(prefixAdmin + "/tasks", authMiddleware.requireAuth, taskRoute);
    app.use(prefixAdmin + "/projects", authMiddleware.requireAuth, projectRoute);
    app.use(prefixAdmin + "/team", authMiddleware.requireAuth, teamRoute);
    app.use(prefixAdmin + "/profile", authMiddleware.requireAuth, profileRoute);
    app.use(prefixAdmin, authRoute);
}
