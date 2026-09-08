const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testConnection() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                ca: fs.readFileSync(path.join(__dirname, 'config', 'ca.pem'))
            }
        });

        console.log('✅ 成功連線至 Aiven MySQL 資料庫！');
        await connection.end();
    } catch (error) {
        console.error('❌ 資料庫連線失敗：', error.message);
    }
}

testConnection();