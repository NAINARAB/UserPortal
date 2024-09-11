import express from "express";
import companyManagement from "../controller/companyManagement.mjs";

const CompanyRoute = express.Router();

CompanyRoute.get('/company', companyManagement.getCompany);
CompanyRoute.post('/company', companyManagement.addCompany);
CompanyRoute.put('/company', companyManagement.updateCompany);
CompanyRoute.delete('/company', companyManagement.deleteCompany);


export default CompanyRoute;