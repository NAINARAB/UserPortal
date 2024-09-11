import sql from 'mssql';
import { dataFound, invalidInput, noData, servError, success } from '../res.mjs';
import { isNumber, randomString } from '../helper_function.mjs';
import { getCompanyDBName } from '../middleware/miniAPIs.mjs';

const UserControl = () => {

    const createUser = async (req, res) => {
        const { Name, UserName, UserTypeId, Password, BranchId, Company_id } = req.body;

        if (!Name || !UserName || !isNumber(UserTypeId) || !Password || !isNumber(BranchId) || !isNumber(Company_id)) {
            return invalidInput(res, 'Name, UserName, UserTypeId, Password, BranchId, and Company_id are required and must be valid.');
        }
    
        const transaction = new sql.Transaction();
    
        try {
            // Check if user already exists
            const checkUserExistsResult = await new sql.Request()
                .input('UserName', UserName)
                .input('Company_id', Company_id)
                .query(`
                    SELECT COUNT(*) AS userCount 
                    FROM [User_Portal].[dbo].[tbl_Users] 
                    WHERE UserName = @UserName AND Company_Id = @Company_id;
                `);
            
            if (checkUserExistsResult.recordset[0].userCount > 0) {
                return invalidInput(res, 'User already exists');
            }
    
            // Get the company database name
            const getDBNameResult = await getCompanyDBName(Company_id);
            if (!getDBNameResult.success) {
                return invalidInput(res, 'Company is not available');
            }
            const { DB_Name } = getDBNameResult.value;
    
            // Global User Creation
            const AuthString = randomString(50);
            const getMaxUserIdResult = await new sql.Request()
                .input('COMPANY_DB', DB_Name)
                .query(`
                    SELECT CASE WHEN COUNT(*) > 0 THEN MAX(UserId) ELSE 0 END AS MaxUserId 
                    FROM [${DB_Name}].[dbo].[tbl_Users];
                `);
            const UserMaxId = Number(getMaxUserIdResult.recordset[0].MaxUserId) + 1;

            await transaction.begin();
    
            const GlobalInsertionResult = await new sql.Request(transaction)
                .input('Company_id', Company_id)
                .input('Local_User_ID', UserMaxId)
                .input('UserName', UserName)
                .input('Name', Name)
                .input('UserTypeId', UserTypeId)
                .input('Password', Password)
                .input('UDel_Flag', 0)
                .input('Autheticate_Id', AuthString)
                .query(`
                    INSERT INTO [User_Portal].[dbo].[tbl_Users] (
                        Local_User_ID, Company_Id, Name, Password, UserTypeId, UserName, UDel_Flag, Autheticate_Id
                    ) VALUES (
                        @Local_User_ID, @Company_Id, @Name, @Password, @UserTypeId, @UserName, @UDel_Flag, @Autheticate_Id
                    );
                    SELECT SCOPE_IDENTITY() AS GlobalId;
                `);
            
            if (GlobalInsertionResult.rowsAffected[0] === 0) {
                throw new Error('Global insertion failed');
            }
            const GlobalUserId = GlobalInsertionResult.recordset[0].GlobalId;
    
            // Local User Creation
            const LocalInsertionResult = await new sql.Request(transaction)
                .input('COMPANY_DB', DB_Name)
                .input('UserId', UserMaxId)
                .input('Global_User_ID', GlobalUserId)
                .input('UserTypeId', UserTypeId)
                .input('Name', Name)
                .input('UserName', UserName)
                .input('Password', Password)
                .input('Company_id', Company_id)
                .input('BranchId', BranchId)
                .input('UDel_Flag', 0)
                .input('Autheticate_Id', AuthString)
                .query(`
                    INSERT INTO [${DB_Name}].[dbo].[tbl_Users] (
                        UserId, Global_User_ID, UserTypeId, Name, UserName, Password, Company_id, BranchId, UDel_Flag, Autheticate_Id
                    ) VALUES (
                        @UserId, @Global_User_ID, @UserTypeId, @Name, @UserName, @Password, @Company_id, @BranchId, @UDel_Flag, @Autheticate_Id
                    );
                `);
    
            if (LocalInsertionResult.rowsAffected[0] === 0) {
                throw new Error('Local insertion failed');
            }
    
            await transaction.commit();
            success(res, 'User created successfully');

        } catch (e) {
            await transaction.rollback();
            servError(e, res);
        }
    };

    const updateUser = async (req, res) => {
        const { 
            UserId, Name, UserName, UserTypeId, Password, BranchId, Company_id 
        } = req.body;
    
        if (!UserId || !Name || !UserName || !isNumber(UserTypeId) || !Password || !isNumber(BranchId) || !isNumber(Company_id)) {
            return invalidInput(res, 'UserId, Name, UserName, UserTypeId, Password, BranchId, and Company_id are required and must be valid.', {
                UserId, Name, UserName, UserTypeId, Password, BranchId, Company_id
            });
        }
    
        const transaction = new sql.Transaction();
    
        try {
            // check if user is already
            const checkUserExistsResult = await new sql.Request()
                .input('UserName', UserName)
                .input('UserId', UserId)
                .input('Company_id', Company_id)
                .query(`
                    SELECT COUNT(*) AS userCount 
                    FROM [User_Portal].[dbo].[tbl_Users] 
                    WHERE UserName = @UserName AND Company_Id = @Company_id AND Local_User_ID <> @UserId;
                `);
            
            if (checkUserExistsResult.recordset[0].userCount > 0) {
                return invalidInput(res, 'User already exists');
            }

            const getDBNameResult = await getCompanyDBName(Company_id);
            if (!getDBNameResult.success) {
                return invalidInput(res, 'Company is not available');
            }
            const { DB_Name } = getDBNameResult.value;
            
            await transaction.begin();
    
            // Update global user record
            const globalUpdateResult = await new sql.Request(transaction)
                .input('UserId', UserId)
                .input('Name', Name)
                .input('UserName', UserName)
                .input('UserTypeId', UserTypeId)
                .input('Password', Password)
                .input('Company_id', Company_id)
                .query(`
                    UPDATE [User_Portal].[dbo].[tbl_Users]
                    SET Name = @Name,
                        UserName = @UserName,
                        UserTypeId = @UserTypeId,
                        Password = @Password
                    WHERE Local_User_ID = @UserId
                    AND Company_Id = @Company_id;
                `);
    
            if (globalUpdateResult.rowsAffected[0] === 0) {
                throw new Error('Global user update failed');
            }
    
            // Update local user record
            const localUpdateResult = await new sql.Request(transaction)
                .input('UserId', UserId)
                .input('Name', Name)
                .input('UserName', UserName)
                .input('UserTypeId', UserTypeId)
                .input('Password', Password)
                .input('BranchId', BranchId)
                .input('Company_id', Company_id)
                .query(`
                    UPDATE [${DB_Name}].[dbo].[tbl_Users]
                    SET Name = @Name,
                        UserName = @UserName,
                        UserTypeId = @UserTypeId,
                        Password = @Password
                    WHERE UserId = @UserId
                    AND Company_id = @Company_id;
                `);
    
            if (localUpdateResult.rowsAffected[0] === 0) {
                throw new Error('Local user update failed');
            }

            await transaction.commit();
            success(res, 'User updated successfully');

        } catch (e) {
            await transaction.rollback();
            servError(e, res);
        }
    };

    const deleteUser = async (req, res) => {
        const { UserId, Company_id } = req.body;
    
        if (!isNumber(UserId) || !isNumber(Company_id)) {
            return invalidInput(res, 'UserId and Company_id are required and must be valid.');
        }
    
        const transaction = new sql.Transaction();
    
        try {    
            const getDBNameResult = await getCompanyDBName(Company_id);
            if (!getDBNameResult.success) {
                return invalidInput(res, 'Company is not available');
            }
            const { DB_Name } = getDBNameResult.value;
            
            await transaction.begin();
    
            const globalUpdateResult = await new sql.Request(transaction)
                .input('UserId', UserId)
                .input('Company_id', Company_id)
                .query(`
                    UPDATE [User_Portal].[dbo].[tbl_Users]
                    SET UDel_Flag = 1
                    WHERE Local_User_ID = @UserId
                    AND Company_Id = @Company_id;
                `);
    
            if (globalUpdateResult.rowsAffected[0] === 0) {
                throw new Error('Global user update failed');
            }
    
            // Update local user record
            const localUpdateResult = await new sql.Request(transaction)
                .input('UserId', UserId)
                .input('Company_id', Company_id)
                .query(`
                    UPDATE [${DB_Name}].[dbo].[tbl_Users]
                    SET UDel_Flag = 1
                    WHERE UserId = @UserId
                    AND Company_id = @Company_id;
                `);
    
            if (localUpdateResult.rowsAffected[0] === 0) {
                throw new Error('Local user update failed');
            }
    
            await transaction.commit();
            success(res, 'User deleted successfully')
        } catch (error) {
            await transaction.rollback();
            servError(error, res);
        }
    };

    const getUsers = async (req, res) => {
        const { Company_id } = req.query;

        try {
            const result = await new sql.Request()
                .input('Company_id', Company_id)
                .query(`
                    SELECT 
                        u.*,
                        ut.UserType,
                        c.Company_Name
                    FROM 
                        [User_Portal].[dbo].[tbl_Users] AS u,
                        [User_Portal].[dbo].[tbl_UserType] AS ut,
                        [User_Portal].[dbo].[tbl_Company] AS c
                    WHERE
                        u.UDel_Flag = 0
                        AND ut.Local_UserType_ID = u.UserTypeId
                        AND ut.Company_id = u.Company_Id
                        AND c.Local_Comp_Id = u.Company_Id
                        ${isNumber(Company_id) ? ' AND u.Company_Id = @Company_id ' : ''}
                    `);
            
            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    };
    
    return {
        createUser,
        updateUser,
        deleteUser,
        getUsers
    }
}


export default UserControl();