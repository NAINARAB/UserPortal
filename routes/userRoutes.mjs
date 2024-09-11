import express from "express";
import userManagement from "../controller/userManagement.mjs";
import Authorization from "../controller/Authorization.mjs";

const UserRouter = express.Router();

UserRouter.get('/users', userManagement.getUsers);
UserRouter.post('/users', userManagement.createUser);
UserRouter.put('/users', userManagement.updateUser);
UserRouter.delete('/users', userManagement.deleteUser);

UserRouter.get('/user/companys', Authorization.getCompanyForUser);


export default UserRouter;