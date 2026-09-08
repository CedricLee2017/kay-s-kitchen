const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// 免強制登入也可以預約，若登入則附帶 token 記錄 user_id
router.post('/', (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        return authMiddleware(req, res, next);
    }
    next();
}, bookingController.createBooking);

module.exports = router;