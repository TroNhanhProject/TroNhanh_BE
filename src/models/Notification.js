const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { // ID của người nhận thông báo (chủ trọ)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    message: { // Nội dung thông báo
        type: String,
        required: true
    },
    type: { // Loại thông báo (ví dụ: 'new_booking', 'booking_approved', 'booking_rejected')
        type: String,
        enum: ['new_booking_request', 'booking_approved', 'booking_rejected', 'new_message', 'other'],
        default: 'other'
    },
    link: { // Đường dẫn để điều hướng khi click (ví dụ: /owner/pending-bookings)
        type: String
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    relatedBookingId: { // ID của booking liên quan (tùy chọn)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);