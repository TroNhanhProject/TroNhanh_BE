const Report = require("../models/Report");
const User = require("../models/User");
const Booking = require("../models/Booking");
const BoardingHouse = require("../models/BoardingHouse");

// 🧾 Tạo báo cáo
exports.createReport = async (req, res) => {
  try {
    const { type, content, boardingHouseId, bookingId, reportedUserId } = req.body;
    const reporterId = req.user.id;

    if (reportedUserId) {
      const existingReport = await Report.findOne({ reporterId, reportedUserId });
      if (existingReport) {
        return res.status(400).json({ message: "You have already reported this user." });
      }
    }

    const report = new Report({
      reporterId,
      reportedUserId,
      boardingHouseId,
      bookingId,
      type,
      content,
    });

    await report.save();
    res.status(201).json(report);
  } catch (error) {
    console.error("❌ Error creating report:", error);
    res.status(500).json({ message: "Failed to create report" });
  }
};

// 📋 Lấy danh sách report của user
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .populate("boardingHouseId", "name location status")
      .populate("bookingId", "checkInDate checkOutDate totalPrice status")
      .populate("reportedUserId", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error("❌ Error in getMyReports:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 👑 Lấy danh sách owner
exports.getOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "owner" }).select("_id name role avatar");
    res.status(200).json(owners);
  } catch (error) {
    console.error("❌ Failed to fetch owners:", error);
    res.status(500).json({ message: "Failed to fetch owners" });
  }
};

// ✅ Kiểm tra lịch sử đặt chỗ giữa user và landlord 
exports.checkBookingHistory = async (req, res) => {
  try {
    const reporterId = req.user?.id;
    const { reportedUserId } = req.query;

    if (!reporterId) {
      return res.status(401).json({ message: "Unauthorized: Missing user info" });
    }

    if (!reportedUserId) {
      return res.status(400).json({ message: "Missing reportedUserId in query params" });
    }

    // 1) Lấy tất cả booking của reporter có trạng thái paid/approved
    const bookings = await Booking.find({
      userId: reporterId,
      status: { $in: ["Paid", "approved"] },
    }).populate({
      path: "boardingHouseId",
      select: "_id ownerId name location",
    });

    // 2) Lọc các booking mà boardingHouse.ownerId === reportedUserId
    const matched = bookings.filter(
      (b) => b.boardingHouseId && b.boardingHouseId.ownerId?.toString() === reportedUserId.toString()
    );

    // 3) Nếu có ít nhất 1 booking phù hợp => hasHistory true
    const hasHistory = matched.length > 0;

    // Trả thêm bookings phù hợp để frontend có thể hiển thị lựa chọn (nếu cần)
    // Chỉ gửi thông tin cần thiết (id, dates, boardingHouse info, totalPrice, status)
    const cleaned = matched.map((b) => ({
      _id: b._id,
      checkInDate: b.checkInDate,
      checkOutDate: b.checkOutDate,
      totalPrice: b.totalPrice,
      status: b.status,
      boardingHouseId: b.boardingHouseId?._id,
      boardingHouseName: b.boardingHouseId?.name,
      boardingHouseLocation: b.boardingHouseId?.location,
    }));
console.log(cleaned);
    return res.status(200).json({ hasHistory, bookings: cleaned });
  } catch (error) {
    console.error("❌ Error checking booking history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

