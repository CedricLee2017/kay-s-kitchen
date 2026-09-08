const db = require('../config/db');

// 建立預約
exports.createBooking = async (req, res) => {
    try {
        const { event_type, event_date, guest_count, contact_name, contact_email, contact_phone, special_requests } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!event_type || !event_date || !guest_count || !contact_name || !contact_email || !contact_phone) {
            return res.status(400).json({ success: false, message: '請填寫完整的預約資訊。' });
        }

        const [result] = await db.query(
            `INSERT INTO bookings 
            (user_id, event_type, event_date, guest_count, contact_name, contact_email, contact_phone, special_requests) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, event_type, event_date, guest_count, contact_name, contact_email, contact_phone, special_requests || null]
        );

        res.status(201).json({
            success: true,
            message: '線上預約提交成功！專人將儘快與您聯繫。',
            bookingId: result.insertId
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤，預約失敗。' });
    }
};

// 查詢個人預約紀錄
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const [bookings] = await db.query('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC', [userId]);

        res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ success: false, message: '伺服器錯誤。' });
    }
};