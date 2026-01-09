const express = require('express');
const route = express.Router();
const controller = require("../../controllers/admin/team-controller");

route.get('/', controller.index);
route.get('/create', controller.create);
route.post('/create', controller.createPost);
route.get('/edit/:id', controller.edit);
route.patch('/edit/:id', controller.editPatch);
route.patch('/change-status/:status/:id', controller.changeStatus);
route.patch('/change-multi', controller.changeMulti);
route.delete('/delete/:id', controller.delete);

module.exports = route;
