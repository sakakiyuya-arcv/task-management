const express = require('express');
const route = express.Router();
const controller = require("../../controllers/admin/project-controller");
const updateStatusMiddleware = require('../../middlewares/admin/update-status-middleware')

route.get('/', updateStatusMiddleware.updateStatus, controller.index);
route.get('/create', controller.create);
route.post('/create', controller.createPost);
route.get('/edit/:id', controller.edit);
route.patch('/edit/:id', controller.editPatch);
route.patch('/change-status/:status/:id', controller.changeStatus);
route.patch('/change-multi', controller.changeMulti);
route.delete('/delete/:id', controller.delete);
route.get('/detail/:id', updateStatusMiddleware.updateStatus, controller.detail);
route.get('/:id/createTask', controller.createTask);
route.post('/:id/createTask', controller.createTaskPost);

module.exports = route;
