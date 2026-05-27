import "./env.js";
import mysql from "mysql2/promise";

const port = Number(process.env.MYSQL_PORT ?? 3306);

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? "127.0.0.1",
  port,
  database: process.env.MYSQL_DATABASE ?? "zhizhi",
  user: process.env.MYSQL_ACCOUNT ?? "root",
  password: process.env.MYSQL_PASSWORD ?? "",
  waitForConnections: true,
  connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT ?? 10),
  namedPlaceholders: true,
  dateStrings: true
});

export type DbPool = typeof pool;
