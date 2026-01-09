const taskRoute = require("./task-route");
const projectRoute = require("./project-route");
const dashboardRoute = require("./dashboard-route");
const authRoute = require("./auth-route");
const teamRoute = require("./team-route");
const profileRoute = require("./profile-route");
const authMiddleware = require('../../middlewares/client/auth-middleware');
const accountMiddleware = require("../../middlewares/client/account.middleware");

module.exports = (app) => {
    app.use(accountMiddleware.infoAccount); // Middleware cho tất cả client routes
    
    app.use("/", authRoute);
    app.use("/dashboard", authMiddleware.requireAuth, dashboardRoute);
    app.use("/tasks", authMiddleware.requireAuth, taskRoute);
    app.use("/projects", authMiddleware.requireAuth, projectRoute);
    app.use("/team", authMiddleware.requireAuth, teamRoute);
    app.use("/profile", authMiddleware.requireAuth, profileRoute);
}
