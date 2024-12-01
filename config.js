import { createPool } from "mysql2/promise";
const MYSQL_CONFIGURATION = {
    host: "localhost",
    user: "root",
    password: "",
    database: "custom_cloud"
};
const pool = createPool(MYSQL_CONFIGURATION);
export { pool, MYSQL_CONFIGURATION };