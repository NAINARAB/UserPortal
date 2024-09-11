import express from "express";
import userManagement from "../controller/userManagement.mjs";


const UserRouter = express.Router();

UserRouter.get('/users', userManagement.getUsers);
UserRouter.post('/users', userManagement.createUser);
UserRouter.put('/users', userManagement.updateUser);
UserRouter.delete('/users', userManagement.deleteUser);


export default UserRouter;