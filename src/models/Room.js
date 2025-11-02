const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  // --- Liên kết tới nhà trọ chứa phòng này ---
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoardingHouse',
    required: true,
    index: true // Rất quan trọng để truy vấn tất cả các phòng của một nhà trọ
  },
  
  // --- Người thuê phòng ---
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // --- Thông tin chi tiết của phòng ---
  roomNumber: { // Số phòng hoặc tên/mã phòng
    type: String,
    required: true,
    trim: true
  },
  description: { // Mô tả riêng cho phòng này (nếu có)
    type: String,
  },
  price: { // Giá thuê của phòng này
    type: Number,
    required: true,
    min: 0
  },
  area: { // Diện tích phòng (m2)
    type: Number,
    required: true,
    min: 0
  },
  status: { // Trạng thái của riêng phòng này
    type: String,
    enum: ['Available', 'Booked', 'Unavailable'], // Còn trống, Đã đặt, Không có sẵn
    default: 'Available'
  },
  photos: { // Ảnh chụp bên trong của phòng này
    type: [String],
    default: [],
  },
  amenities: { // Tiện ích riêng của phòng
    type: [String],
    default: [] // Ví dụ: 'Có gác lửng', 'Ban công riêng', 'Nội thất đầy đủ'
  },

  // --- Dấu thời gian ---
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

RoomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Đảm bảo mỗi phòng trong một nhà trọ là duy nhất
RoomSchema.index({ boardingHouseId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);