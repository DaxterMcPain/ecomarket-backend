import mysql from "mysql2/promise";
import 'dotenv/config';

const db = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "contra123",
    database: process.env.DB_DATABASE || "ecomarket",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,

    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default db;