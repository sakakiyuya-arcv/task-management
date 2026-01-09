const express = require('express');
const route = express.Router();
const controller = require("../../controllers/client/dashboard-controller");
const updateStatusMiddleware = require('../../middlewares/client/update-status-middleware')

route.get('/', updateStatusMiddleware.updateStatus, controller.index);

module.exports = route;
