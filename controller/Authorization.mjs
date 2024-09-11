import sql from 'mssql';
import { dataFound, invalidInput, noData, servError } from '../res.mjs';
// import { isNumber } from '../helper_function.mjs';


const Authorization = () => {
    
    const getCompanyForUser = async (req, res) => {
        const { username } = req.query;

        if (!username) {
            return invalidInput(res, 'username is required');
        }

        try {
            const result = await new sql.Request()
                .input('username', username)
                .query(`
                    SELECT 
                        c.Company_Name,
                        c.Local_Comp_Id AS Local_Id,
                        c.Global_Comp_Id AS Global_Id,
                        c.Web_Api
                    FROM
                        [User_Portal].[dbo].[tbl_Company] AS c,
                        [User_Portal].[dbo].[tbl_Users] AS u
                    WHERE
                        u.UserName = @username
                        AND
                        u.Company_Id = c.Local_Comp_Id
                    `)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    }
    
    // const login = async (req, res) => {
    //     const { Global_Comp_Id, username, password } = req.body;

    //     if (!isNumber(Global_Comp_Id) || !username || !password) {
    //         return invalidInput(res, 'Global_Comp_Id, username, password is required');
    //     }

    //     try {
    //         const result = await new sql.Request()
    //             .input('Global_Comp_Id', Global_Comp_Id)
    //             .input('username', username)
    //             .input('password', password)
    //             .query(`
    //                 SELECT
    //                     u.UserTypeId,
    //                     u.Local_User_ID AS UserId,
    //                     u.Global_User_ID,
    //                     u.UserName,
    //                     u.Password,
    //                     u.BranchId,
    //                     b.BranchName,
    //                     u.Name,
    //                     ut.UserType,
    //                     u.Autheticate_Id,
    //                     u.Company_id,
    //                     c.Company_Name
    //                 FROM tbl_Users AS u
    //                 LEFT JOIN tbl_Branch_Master AS b ON b.BranchId = u.BranchId
    //                 LEFT JOIN tbl_User_Type AS ut ON ut.Id = u.UserTypeId
    //                 LEFT JOIN tbl_Company_Master AS c ON c.Company_id = u.Company_Id
    //                 WHERE LOWER(UserName) = LOWER(@UserName) AND Password = @Password AND UDel_Flag = 0 
    //                 `);
    //     } catch (e) {
    //         servError(e, res);
    //     }
    // }

    return {
        getCompanyForUser,

    }
}

export default Authorization();