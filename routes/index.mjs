import express from "express";
import UserRouter from "./userRoutes.mjs";
import userTypeRouter from "./userTypeRoutes.mjs";
import CompanyRoute from "./companyRoutes.mjs";

const IndexRouter = express.Router();

IndexRouter.use('/masters', UserRouter, userTypeRouter, CompanyRoute);



export default IndexRouter;