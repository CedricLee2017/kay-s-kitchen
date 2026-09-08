const db = require('../config/db');

async function initTables() {
  try {
    // 1. 建立 users 資料表
    await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                phone VARCHAR(20) DEFAULT NULL,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

    // 檢查 users 資料表是否包含 password_hash 欄位，若無則自動新增
    const [columns] = await db.query(`SHOW COLUMNS FROM users LIKE 'password_hash'`);
    if (columns.length === 0) {
      // 如果舊的 users 表存在 password 欄位，將其重新命名為 password_hash
      const [oldPasswordCol] = await db.query(`SHOW COLUMNS FROM users LIKE 'password'`);
      if (oldPasswordCol.length > 0) {
        await db.query(`ALTER TABLE users CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL`);
        console.log('🔄 已成功將 users 資料表之 password 欄位重命名為 password_hash');
      } else {
        await db.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER email`);
        console.log('➕ 已成功向 users 資料表補齊 password_hash 欄位');
      }
    }

    // 2. 建立 bookings 線上預約資料表
    await db.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT DEFAULT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                event_type VARCHAR(50) NOT NULL,
                event_date DATE NOT NULL,
                guests INT NOT NULL,
                special_request TEXT,
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

    // 3. 建立 orders 購物車與訂單資料表
    await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                total_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'paid', 'completed', 'cancelled') DEFAULT 'pending',
                items_json JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

    console.log(' SQL 資料表初始化完成。');
  } catch (error) {
    console.error('❌ 初始化資料表失敗:', error.message);
    throw error;
  }
}

module.exports = initTables;