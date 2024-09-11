import userTypeManagement from "../controller/userTypeManagement.mjs";
import express from "express";

const userTypeRouter = express.Router();


userTypeRouter.get('/userType', userTypeManagement.getUserType);
userTypeRouter.post('/userType', userTypeManagement.createUserType);
userTypeRouter.put('/userType', userTypeManagement.updateUserType);


export default userTypeRouter;