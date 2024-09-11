import sql from 'mssql';
import { dataFound, invalidInput, noData, servError, success } from '../res.mjs';
import { isNumber } from '../helper_function.mjs';
import { getCompanyDBName } from '../middleware/miniAPIs.mjs';


const UserTypeControl = () => {

    const getUserType = async (req, res) => {

        try {
            const result = await sql.query('SELECT * FROM [User_Portal].[dbo].[tbl_UserType]');

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res)
        }

    }

    const createUserType = async (req, res) => {
        const { UserType, Company_id } = req.body;

        const transaction = new sql.Transaction();

        try {
            const existCheck = (await new sql.Request()
                .input('UserType', UserType)
                .input('Company_id', Company_id)
                .query(`
                    SELECT COUNT(*) AS Exist 
                    FROM [User_Portal].[dbo].[tbl_UserType] 
                    WHERE UserType = @UserType AND Company_id = @Company_id;`)
            ).recordset[0].Exist;

            if (existCheck !== 0) {
                throw new Error('User Type already exists');
            }

            // Get the company database name
            const getDBNameResult = await getCompanyDBName(Company_id);
            if (!getDBNameResult.success) {
                return invalidInput(res, 'Company is not available');
            }
            const { DB_Name } = getDBNameResult.value;

            const getMaxUserTypeId = await new sql.Request()
                .query(`
                    SELECT CASE WHEN COUNT(*) > 0 THEN MAX(Id) ELSE 0 END AS MaxUserTypeId 
                    FROM [${DB_Name}].[dbo].[tbl_User_Type];
                `);

            const UserMaxId = Number(getMaxUserTypeId.recordset[0].MaxUserTypeId) + 1;

            await transaction.begin();

            // Global Insertion
            const GlobalInsertionResult = await new sql.Request(transaction)
                .input('Local_UserType_ID', UserMaxId)
                .input('Company_id', Company_id)
                .input('UserType', UserType)
                .query(`
                    INSERT INTO [User_Portal].[dbo].[tbl_UserType] (
                        Local_UserType_ID, UserType, Company_id
                    ) VALUES (
                        @Local_UserType_ID, @UserType, @Company_id
                    )`
                );

            if (GlobalInsertionResult.rowsAffected[0] === 0) {
                throw new Error('Global insert operation failed')
            }

            const LocalInsertResult = await new sql.Request(transaction)
                .input('Local_UserType_ID', UserMaxId)
                .input('UserType', UserType)
                .query(`
                    INSERT INTO [${DB_Name}].[dbo].[tbl_User_Type] (
                        Id, UserType, Alias, IsActive 
                    ) VALUES (
                        @Local_UserType_ID, @UserType, @UserType, 1
                    )`
                );


            if (LocalInsertResult.rowsAffected[0] === 0) {
                throw new Error('Local Insertion Failed')
            }

            await transaction.commit();
            success(res, 'User type created')


        } catch (e) {
            await transaction.rollback();
            servError(e, res);
        }
    }

    const updateUserType = async (req, res) => {
        const { Id, UserType, Company_id } = req.body;

        if (!isNumber(Id) || !UserType || !isNumber(Company_id)) {
            return invalidInput(res, 'Id, UserType and Company_id is required');
        }

        const transaction = new sql.Transaction();

        try {
            const existCheck = (await new sql.Request()
                .input('UserType', UserType)
                .input('Company_id', Company_id)
                .input('Id', Id)
                .query(`
                    SELECT COUNT(*) AS Exist 
                    FROM [User_Portal].[dbo].[tbl_UserType] 
                    WHERE UserType = @UserType AND Company_id = @Company_id AND Local_UserType_ID <> @Id;`)
            ).recordset[0].Exist;

            if (existCheck !== 0) {
                throw new Error('User Type already exists');
            }

            const getDBNameResult = await getCompanyDBName(Company_id);
            if (!getDBNameResult.success) {
                return invalidInput(res, 'Company is not available');
            }
            const { DB_Name } = getDBNameResult.value;

            await transaction.begin();

            const GlobalUpdate = await new sql.Request(transaction)
                .input('Company_id', Company_id)
                .input('UserType', UserType)
                .input('Id', Id)
                .query(`
                    UPDATE [User_Portal].[dbo].[tbl_UserType]
                    SET
                        UserType = @UserType
                    WHERE
                        Local_UserType_ID = @Id
                        AND
                        Company_id = @Company_id`
                );

            if (GlobalUpdate.rowsAffected[0] === 0) {
                throw new Error('global update failed');
            }

            const LocalUpdate = await new sql.Request(transaction)
                .input('UserType', UserType)
                .input('Id', Id)
                .query(`
                    UPDATE [${DB_Name}].[dbo].[tbl_User_Type]
                    SET 
                        UserType = @UserType
                    WHERE
                        Id = @Id;`
                );

            if (LocalUpdate.rowsAffected[0] === 0) {
                throw new Error('local update failed');
            }

            await transaction.commit();
            success(res, 'Changes Saved!');

        } catch (e) {
            await transaction.rollback();
            servError(e, res);
        }

    }

    return {
        getUserType,
        createUserType,
        updateUserType,
    }
}

export default UserTypeControl();