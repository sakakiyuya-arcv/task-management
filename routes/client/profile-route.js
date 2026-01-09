const express = require('express');
const route = express.Router();
const controller = require("../../controllers/client/profile-controller");
const upload = require("../../middlewares/client/upload-middleware");

route.get('/', controller.index);
route.get('/edit/:id', controller.edit);
route.patch('/edit/:id', upload.single('avatar'), controller.editPatch);
route.get('/change-password/:id', controller.changePassword);
route.patch('/change-password/:id', controller.changePasswordPatch);

module.exports = route;
