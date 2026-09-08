const express = require('express');
const router = express.Router();
const db = require('../config/db');

// 測試資料庫連線 API
router.get('/db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.status(200).json({
            success: true,
            message: '伺服器與 Aiven MySQL 資料庫連線成功！',
            db_test_result: rows[0].result,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('資料庫測試連線失敗:', error.message);
        res.status(500).json({
            success: false,
            message: '伺服器連線正常，但資料庫連線失敗。',
            error: error.message
        });
    }
});

module.exports = router;