const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: '未提供驗證 Token，請先登入會員。'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'caterserv_secret_jwt_key_2026_super_secure');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Token 無效或已過期，請重新登入。'
        });
    }
};