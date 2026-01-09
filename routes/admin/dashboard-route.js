const express = require('express');
const route = express.Router();
const controller = require("../../controllers/admin/dashboard-controller");
const updateStatusMiddleware = require('../../middlewares/admin/update-status-middleware')

route.get('/', updateStatusMiddleware.updateStatus, controller.index);

module.exports = route;
