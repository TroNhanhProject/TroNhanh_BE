const cron = require("node-cron");
const Booking = require("../models/Booking");
const Accommodation = require("../models/Accommodation");

// Thời gian hết hạn booking: 15 phút (tính bằng ms)
const EXPIRATION_TIME = 15 * 60 * 1000;

// Cron job chạy mỗi phút
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // Lấy tất cả booking còn pending
    const pendingBookings = await Booking.find({ status: "pending" });
    const totalPending = pendingBookings.length;

    // Lọc ra booking quá hạn
    const expiredBookings = pendingBookings.filter(
      (b) => now - b.createdAt > EXPIRATION_TIME
    );

    if (expiredBookings.length > 0) {
      for (const booking of expiredBookings) {
        // Cập nhật booking -> cancelled
        booking.status = "cancelled";
        await booking.save();

        // Mở lại phòng
        await Accommodation.findByIdAndUpdate(booking.propertyId, {
          status: "Available",
          customerId: null,
        });
      }
    }

    // In log chi tiết
    console.log(
      `\n🕒 [${new Date().toLocaleTimeString("vi-VN")}] Booking cron report:`
    );
    console.log(
      `   🟡 Pending bookings checked: ${totalPending}`
    );
    console.log(
      expiredBookings.length > 0
        ? `   ❌ Expired & cancelled: ${expiredBookings.length}`
        : "   ✅ No expired bookings found"
    );

  } catch (error) {
    console.error("🔥 Error in booking cleanup cron job:", error);
  }
});

console.log("✅ Booking expiry cron job started (runs every 1 minute)");
