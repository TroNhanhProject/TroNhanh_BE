const Report = require('../models/Report')
const User = require('../models/User');
const Booking = require('../models/Booking');
const Accommodation = require('../models/Accommodation')
exports.createReport = async (req, res) => {
  try {
    const { type, content, accommodationId, bookingId, reportedUserId } = req.body;
    const reporterId = req.user.id;



    const reportData = {
      reporterId,
      type,
      content,
    };

    if (accommodationId) reportData.accommodationId = accommodationId;
    if (bookingId) reportData.bookingId = bookingId;
    if (reportedUserId) reportData.reportedUserId = reportedUserId;

    const report = new Report(reportData);
    await report.save();

    res.status(201).json(report);
  } catch (error) {
    console.error("❌ Error creating report:", error);
    res.status(500).json({ message: "Failed to create report" });
  }
};


exports.getMyReports = async (req, res) => {
  try {
    console.log("🔍 Getting reports for user:", req.user);
    console.log("🔍 User ID:", req.user?.id);

    const reports = await Report.find({ reporterId: req.user.id })
      .populate('accommodationId', 'title location status')
      .populate('bookingId', 'checkInDate checkOutDate totalPrice status')
      .populate('reportedUserId', 'name email')
      .sort({ createAt: -1 });

    console.log("✅ Found reports:", reports.length);
    res.json(reports);
  } catch (error) {
    console.error("❌ Error in getMyReports:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('_id name role avatar');
    res.status(200).json(owners);
  } catch (error) {
    console.error("Failed to fetch owners:", error);
    res.status(500).json({ message: "Failed to fetch owners" });
  }
};
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

    // Tìm tất cả accommodation của owner bị report
    const properties = await Accommodation.find({ ownerId: reportedUserId }).select("_id");
    const propertyIds = properties.map(p => p._id);

    if (propertyIds.length === 0) {
      return res.status(200).json({ hasHistory: false, bookings: [] });
    }

    const bookings = await Booking.find({
      userId: reporterId,
      propertyId: { $in: propertyIds },
      status: { $in: ["paid", "approved"] },
    })
    .select("_id checkInDate checkOutDate propertyId")
    .populate({
      path: "propertyId",
      select: "_id title location" // thêm các trường cần dùng từ Accommodation
    });

    return res.status(200).json({
      hasHistory: bookings.length > 0,
      bookings
    });

  } catch (error) {
    console.error("Error checking booking history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
