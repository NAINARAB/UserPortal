import sql from 'mssql';
import { checkIsNumber } from '../helper_function.mjs';

export const getUserType = async (UserId) => {
    if (!checkIsNumber(UserId)) {
        return {
            success: false,
            value: {
                Global_UserType_ID: null,
                Local_UserType_ID: null,
            }
        };
    }

    try {
        const userTypeDetails = (await new sql.Request()
            .input('UserId', UserId)
            .query(`
                SELECT 
                    ut.Local_UserType_ID,
                    ut.Global_UserType_ID
                FROM 
                    tbl_Users AS u,
                    tbl_UserType AS ut
                WHERE 
                    u.Global_Comp_Id =  @UserId
                    AND
                    u.UserTypeId = ut.Local_UserType_ID
            `)
        ).recordset;

        if (userTypeDetails.length > 0 && Boolean(Number(userTypeDetails[0].Local_UserType_ID))) {
            return {
                success: true,
                value: {
                    Global_UserType_ID: userTypeDetails[0].Global_UserType_ID,
                    Local_UserType_ID: userTypeDetails[0].Local_UserType_ID,
                }
            };
        } else {
            return {
                success: false,
                value: {
                    Global_UserType_ID: null,
                    Local_UserType_ID: null,
                }
            };
        }
    } catch (e) {
        console.error(e);
        return {
            success: false,
            value: {
                Global_UserType_ID: null,
                Local_UserType_ID: null,
            }
        };
    }
}

export const getUserIdByAuth = async (Auth) => {

    if (!Auth) {
        return {
            success: false,
            value: {
                GlobalId: null,
                LocalId: null,
            }
        };
    }

    try {
        const UserResults = (
            await new sql.Request()
                .input('Auth', Auth)
                .query(`
                    SELECT 
                        Global_User_ID,
                        Local_User_ID
                    FROM 
                        tbl_Users
                    WHERE 
                        u.Autheticate_Id =  @Auth ;`
                )
        ).recordset;

        if (UserResults.length > 0 && Boolean(Number(UserResults[0].Global_User_ID))) {
            return {
                success: true,
                value: {
                    GlobalId: Number(UserResults[0].Global_User_ID),
                    LocalId: Number(UserResults[0].Local_User_ID),
                }
            };
        } else {
            return {
                success: false,
                value: {
                    GlobalId: null,
                    LocalId: null,
                }
            };
        }
    } catch (e) {
        console.error(e);
        return {
            success: false,
            value: {
                GlobalId: null,
                LocalId: null,
            }
        };
    }
}

export const getGlobalCompany = async (LocalCompanyId) => {

    if (!checkIsNumber(LocalCompanyId)) {
        return {
            success: false,
            value: {
                GlobalId: null,
                LocalId: null,
            }
        }
    }

    try {

        const result = (await new sql.Request()
            .input('LocalId', LocalCompanyId)
            .query(`
                SELECT 
                    Global_Comp_Id,
                    Local_Comp_Id
                FROM
                    [User_Portal].[dbo].[tbl_Company]
                WHERE
                    Local_Comp_Id = @LocalId`
            )
        ).recordset;

        if (result.length > 0 && result[0].Global_Comp_Id) {
            return {
                success: true,
                value: {
                    GlobalId: result[0].Global_Comp_Id,
                    LocalId: result[0].Local_Comp_Id,
                }
            }
        } else {
            return {
                success: false,
                value: {
                    GlobalId: null,
                    LocalId: null,
                }
            }
        }

    } catch (e) {
        console.error(e);
        return {
            success: false,
            value: {
                GlobalId: null,
                LocalId: null,
            }
        }
    }
}

export const getCompanyDBName = async (CompanyId) => {

    if (!checkIsNumber(CompanyId)) {
        return {
            success: false,
            value: {
                GlobalId: null,
                DB_Name: null,
                Company_Name: null,
            }
        }
    }

    try {

        const result = (await new sql.Request()
            .input('CompanyId', CompanyId)
            .query(`
                SELECT 
                    Global_Comp_Id,
                    Local_Comp_Id,
                    Company_Name,
                    [DB_Name]
                FROM 
                    [User_Portal].[dbo].[tbl_Company]
                WHERE
                    Local_Comp_Id = @CompanyId ;`
            )
        ).recordset;

        if (result.length === 1 && result[0].DB_Name) {
            return {
                success: true,
                value: {
                    GlobalId: result[0].Global_Comp_Id,
                    DB_Name: result[0].DB_Name,
                    Company_Name: result[0].Company_Name,
                }
            }
        } else {
            return {
                success: false,
                value: {
                    GlobalId: null,
                    DB_Name: null,
                    Company_Name: null,
                }
            }
        }

    } catch (e) {
        console.error(e);
        return {
            success: false,
            value: {
                GlobalId: null,
                DB_Name: null,
                Company_Name: null,
            }
        }
    }
}