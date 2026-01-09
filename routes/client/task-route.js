const express = require('express');
const route = express.Router();
const controller = require("../../controllers/client/task-controller");
const upload = require("../../middlewares/client/upload-middleware");
const updateStatusMiddleware = require("../../middlewares/client/update-status-middleware");

route.use(updateStatusMiddleware.updateStatus); 

route.get('/', controller.index);
route.patch('/change-status/:status/:id', controller.changeStatus);
route.patch('/change-multi', controller.changeMulti);
route.get('/detail/:id', controller.detail);
route.post('/:id/upload', upload.single('file'), controller.upload);
route.delete('/:id/delete-attachment/:index', controller.deleteAttachment);

module.exports = route;
