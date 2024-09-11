import sql from 'mssql';
import { dataFound, failed, invalidInput, noData, servError, success } from '../res.mjs';
import { isNumber } from '../helper_function.mjs';

const CompanyControl = () => {

    const addCompany = async (req, res) => {

        const { Company_Name, DB_Name, Local_Comp_Id, Web_Api } = req.body;

        if (!Company_Name || !DB_Name || !isNumber(Local_Comp_Id) || !Web_Api) {
            return invalidInput(res, 'Company_Name, DB_Name, Web_Api and Local_Comp_Id are required');
        }

        const transaction = new sql.Transaction();

        try {
            const checkIfExist = await new sql.Request()
                .input('Company_Name', Company_Name)
                .input('DB_Name', DB_Name)
                .query(`
                    SELECT COUNT(*) AS Exist
                    FROM [User_Portal].[dbo].[tbl_Company]
                    WHERE Company_Name = @Company_Name OR DB_Name = @DB_Name ;`
                );

            if (checkIfExist.recordset[0].Exist !== 0) {
                throw new Error('Company Already Exist');
            }

            await transaction.begin();
            const GlobalInsertionResult = await new sql.Request(transaction)
                .input('Company_Name', Company_Name)
                .input('Local_Comp_Id', Local_Comp_Id)
                .input('DB_Name', DB_Name)
                .input('Web_Api', Web_Api)
                .query(`
                    INSERT INTO [User_Portal].[dbo].[tbl_Company] (
                        Company_Name, DB_Name, Local_Comp_Id, Web_Api
                    ) VALUES (
                        @Company_Name, @DB_Name, @Local_Comp_Id, @Web_Api
                    )`
                );

            if (GlobalInsertionResult.rowsAffected[0] === 0) {
                throw new Error('failed to insert');
            }

            await transaction.commit();
            success(res, 'Company Created Successfully');

        } catch (e) {
            transaction.rollback();
            servError(e, res);
        }
    }

    const updateCompany = async (req, res) => {
        const { Global_Comp_Id, Local_Comp_Id, Company_Name, DB_Name, Web_Api } = req.body;

        if (!isNumber(Global_Comp_Id) || !Company_Name || !DB_Name || !isNumber(Local_Comp_Id) || !Web_Api) {
            return invalidInput(res, 'Global_Comp_Id, Company_Name, DB_Name, Web_Api and Local_Comp_Id are required');
        }

        try {
            const checkIfExists = await new sql.Request()
                .input('Company_Name', Company_Name)
                .input('DB_Name', DB_Name)
                .input('Global_Comp_Id', Global_Comp_Id)
                .input('Local_Comp_Id', Local_Comp_Id)
                .query(`
                    SELECT COUNT(*) AS Exist
                    FROM [User_Portal].[dbo].[tbl_Company]
                    WHERE 
                        Global_Comp_Id <> @Global_Comp_Id 
                        AND (
                            Company_Name = @Company_Name 
                            OR DB_Name = @DB_Name 
                            OR Local_Comp_Id = @Local_Comp_Id
                        );`
                );

            if (checkIfExists.recordset[0].Exist !== 0) {
                return failed(res,'Company Already Exist');
            }

            const result = await new sql.Request()
                .input('Company_Name', Company_Name)
                .input('DB_Name', DB_Name)
                .input('Global_Comp_Id', Global_Comp_Id)
                .input('Local_Comp_Id', Local_Comp_Id)
                .input('Web_Api', Web_Api)
                .query(`
                    UPDATE [User_Portal].[dbo].[tbl_Company]
                    SET 
                        Company_Name = @Company_Name,
                        DB_Name = @DB_Name,
                        Local_Comp_Id = @Local_Comp_Id,
                        Web_Api = @Web_Api
                    WHERE
                        Global_Comp_Id = @Global_Comp_Id;`
                )
            
            if (result.rowsAffected[0] !== 0) {
                success(res, 'Changes Saved')
            } else {
                failed(res, 'Failed to save changes')
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const deleteCompany = async (req, res) => {
        const { Global_Comp_Id } = req.body;

        if (!isNumber(Global_Comp_Id)) {
            return invalidInput(res, 'Global_Comp_Id is required')
        }

        try {
            const checkIfExists = await new sql.Request()
                .input('Global_Comp_Id', Global_Comp_Id)
                .query(`
                    SELECT COUNT(*) AS Exist
                    FROM [User_Portal].[dbo].[tbl_Company]
                    WHERE Global_Comp_Id = @Global_Comp_Id;`
                );

            if (checkIfExists.recordset[0].Exist !== 1) {
                return failed(res,'Company not available');
            }

            const result = await new sql.Request()
                .input('Global_Comp_Id', Global_Comp_Id)
                .query(`DELETE FROM [User_Portal].[dbo].[tbl_Company] WHERE Global_Comp_Id = @Global_Comp_Id`);

            if (result.rowsAffected[0] !== 0) {
                success(res, 'Company deleted!');
            } else {
                failed(res, 'Failed to delete, Try Again!');
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getCompany = async (req, res) => {
        try {
            const result = await sql.query('SELECT * FROM [User_Portal].[dbo].[tbl_Company];');
            
            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        addCompany,
        updateCompany,
        deleteCompany,
        getCompany
    }
}


export default CompanyControl();