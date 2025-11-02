const Notification = require('../models/Notification');

exports.getOwnerNotifications = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const { limit = 10, onlyUnread = false } = req.query;

        const query = { userId: ownerId };
        if (onlyUnread === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({ userId: ownerId, isRead: false });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error("[GET OWNER NOTIFICATIONS ERROR]", error);
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo.' });
    }
};

exports.markNotificationAsRead = async (req, res) => {
     try {
        const { notificationId } = req.params;
        const ownerId = req.user.id;

        const result = await Notification.findOneAndUpdate(
            { _id: notificationId, userId: ownerId },
            { isRead: true },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo hoặc bạn không có quyền.' });
        }
        res.status(200).json({ message: 'Đã đánh dấu là đã đọc.', notification: result });
    } catch (error) {
        console.error("[MARK NOTIFICATION READ ERROR]", error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
}