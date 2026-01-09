const express = require('express');
const route = express.Router();
const controller = require("../../controllers/admin/task-controller");
const upload = require("../../middlewares/admin/upload-middleware");
const updateStatusMiddleware = require("../../middlewares/admin/update-status-middleware");

route.use(updateStatusMiddleware.updateStatus);

route.get('/', controller.index);
route.get('/create', controller.create);
route.post('/create', controller.createPost);
route.get('/edit/:id', controller.edit);
route.patch('/edit/:id', controller.editPatch);
route.patch('/change-status/:status/:id', controller.changeStatus);
route.patch('/change-multi', controller.changeMulti);
route.delete('/delete/:id', controller.delete);
route.get('/detail/:id', controller.detail);
route.post('/:id/upload', upload.single('file'), controller.upload);
route.delete('/:id/delete-attachment/:index', controller.deleteAttachment);

module.exports = route;
