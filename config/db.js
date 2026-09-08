const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 15782,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        name VARCHAR(100) NOT NULL,
        google_id VARCHAR(255) DEFAULT NULL UNIQUE,
        avatar VARCHAR(500) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    try {
        const connection = await pool.getConnection();

        // 1. 建立資料表 (若不存在)
        await connection.query(createUsersTableSQL);

        // 2. 檢查並調整 password_hash 欄位允許為 NULL
        const [passHashCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'password_hash'");
        if (passHashCols.length > 0) {
            await connection.query("ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) DEFAULT NULL");
            console.log('🛠️ 已成功修正 password_hash 欄位為允許 NULL');
        } else {
            // 若完全沒有 password_hash 欄位則補上
            await connection.query("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) DEFAULT NULL AFTER email");
            console.log('🛠️ 已為 users 資料表補上 password_hash 欄位');
        }

        // 3. 檢查並調整 password 欄位 (若先前建立過) 允許為 NULL
        const [passCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'password'");
        if (passCols.length > 0) {
            await connection.query("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) DEFAULT NULL");
            console.log('🛠️ 已成功修正 password 欄位為允許 NULL');
        }

        // 4. 檢查並補齊 google_id 欄位
        const [googleCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'google_id'");
        if (googleCols.length === 0) {
            await connection.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL UNIQUE");
            console.log('🛠️ 已為 users 資料表補上 google_id 欄位');
        }

        // 5. 檢查並補齊 avatar 欄位
        const [avatarCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'avatar'");
        if (avatarCols.length === 0) {
            await connection.query("ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL");
            console.log('🛠️ 已為 users 資料表補上 avatar 欄位');
        }

        connection.release();
        console.log('✅ 成功連線至 Aiven Cloud MySQL 並完成 Users 資料表結構自動修正');
    } catch (err) {
        console.error('❌ 資料庫初始化失敗：', err.message);
    }
}

initDB();

module.exports = pool;