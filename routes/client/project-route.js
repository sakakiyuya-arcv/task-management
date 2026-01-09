const express = require('express');
const route = express.Router();
const controller = require("../../controllers/client/project-controller");
const updateStatusMiddleware = require('../../middlewares/client/update-status-middleware')

route.get('/', updateStatusMiddleware.updateStatus, controller.index);
route.get('/detail/:id', updateStatusMiddleware.updateStatus, controller.detail);

module.exports = route;
