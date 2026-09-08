const db = require('../config/db');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.googleLogin = async (req, res) => {
    const { credential } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!credential) {
        return res.status(400).json({ success: false, message: '缺少 Google Token 憑證' });
    }

    if (!clientId) {
        console.error('❌ 後端環境變數遺失：未設定 GOOGLE_CLIENT_ID');
        return res.status(500).json({ success: false, message: '伺服器設定錯誤' });
    }

    try {
        const client = new OAuth2Client(clientId);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: clientId,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        let existingUsers;
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE google_id = ? OR email = ?',
                [googleId, email]
            );
            existingUsers = rows;
        } catch (dbErr) {
            console.error('❌ MySQL 查詢失敗：', dbErr.message);
            return res.status(500).json({ success: false, message: '資料庫連線或查詢失敗，請重新啟動伺服器' });
        }

        let user = existingUsers[0];

        if (!user) {
            // 新增使用者，不帶密碼欄位（已修正資料表允許 NULL）
            const [result] = await db.execute(
                'INSERT INTO users (name, email, google_id, avatar) VALUES (?, ?, ?, ?)',
                [name, email, googleId, avatar]
            );
            user = {
                id: result.insertId,
                name,
                email,
                google_id: googleId,
                avatar
            };
        } else if (!user.google_id) {
            // 若為舊有本地帳號登入，則補上 google_id 與頭像
            await db.execute(
                'UPDATE users SET google_id = ?, avatar = ? WHERE id = ?',
                [googleId, avatar, user.id]
            );
            user.google_id = googleId;
            user.avatar = avatar;
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email },
            process.env.JWT_SECRET || 'caterserv_secret_jwt_key_2026_super_secure',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Google 登入成功！',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error('❌ Google 驗證錯誤詳細資訊：', error);
        return res.status(401).json({ success: false, message: 'Google 身分驗證失敗' });
    }
};