const mongoose = require('mongoose');

const BoardingHouseSchema = new mongoose.Schema({
  // --- Thông tin chủ sở hữu và quản lý ---
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Tăng tốc độ truy vấn theo chủ sở hữu
  },
  
  // --- Thông tin cơ bản của nhà trọ ---
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên nhà trọ'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Vui lòng nhập mô tả cho nhà trọ']
  },
  location: {
    district: { type: String, required: true },
    street: { type: String, required: true },
    addressDetail: { type: String, required: true },
    latitude: Number,
    longitude: Number
  },

  // --- Tiện ích và hình ảnh chung ---
  photos: { // Ảnh chụp bên ngoài, khu vực chung (nhà xe, sân phơi,...)
    type: [String],
    default: [],
  },
  amenities: { // Tiện ích chung cho cả nhà trọ
    type: [String],
    default: [] // Ví dụ: 'Chỗ để xe', 'Camera an ninh', 'Wifi miễn phí', 'Giờ giấc tự do'
  },

  // --- Trạng thái duyệt bài đăng ---
  isApproved: { // Trường này có thể giữ lại nếu bạn có hệ thống admin duyệt bài đăng nhà trọ
    type: Boolean,
    default: false
  },
  approvedStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'deleted'],
    default: 'pending',
  },
  approvedAt: {
    type: Date
  },
  rejectedReason: {
    type: String,
    default: ''
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

BoardingHouseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Tạo index cho việc tìm kiếm text hiệu quả hơn
BoardingHouseSchema.index({ name: 'text', description: 'text', 'location.addressDetail': 'text' });

module.exports = mongoose.model('BoardingHouse', BoardingHouseSchema);