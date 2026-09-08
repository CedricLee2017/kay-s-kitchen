const db = require('../config/db');

exports.createOrder = async (req, res) => {
    const { items, totalAmount } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: '購物車不得為空' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
            [userId, totalAmount, 'paid']
        );
        const orderId = orderResult.insertId;

        for (const item of items) {
            await connection.query(
                'INSERT INTO order_items (order_id, item_name, price, quantity) VALUES (?, ?, ?, ?)',
                [orderId, item.name, item.price, item.quantity]
            );
        }

        await connection.commit();
        res.status(201).json({ success: true, message: '訂單建立成功！', orderId });
    } catch (error) {
        await connection.rollback();
        console.error('訂單處理失敗:', error);
        res.status(500).json({ success: false, message: '結帳失敗，請稍後再試' });
    } finally {
        connection.release();
    }
};