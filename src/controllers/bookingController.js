const Booking = require("../models/Booking");
const Accommodation = require("../models/Accommodation");
const Payment = require("../models/Payment");
exports.createBooking = async (req, res) => {
  try {
    const { userId, propertyId, guestInfo, startDate, leaseDuration, guests } =
      req.body;

    // Check if the accommodation is approved and available
    const property = await Accommodation.findOne({
      _id: propertyId,
      approvedStatus: "approved",
      status: "Available"
    });
    if (!property) {
      return res
        .status(400)
        .json({ message: "Accommodation is not available for booking." });
    }
    const existingBooking = await Booking.findOne({
      userId,
      propertyId,
      status: "pending",
    });

    if (existingBooking) {
      const minutesSince = (Date.now() - existingBooking.createdAt) / (1000 * 60);
      if (minutesSince < 15) {
        return res.status(400).json({
          message: "You already have a pending booking for this accommodation. Please complete payment or wait 15 minutes."
        });
      } else {
        existingBooking.status = "cancelled";
        await existingBooking.save();
      }
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const booking = await Booking.create({
      userId,
      propertyId,
      guestInfo,
      status: "pending",
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Checkout function to make accommodation available again
exports.checkoutBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking status to completed
    await Booking.findByIdAndUpdate(bookingId, {
      status: "completed"
    });

    // Make accommodation available again
    await Accommodation.findByIdAndUpdate(booking.propertyId, {
      customerId: null,
      status: "Available"
    });

    console.log("✅ Customer checked out, accommodation is now available again.");
    res.status(200).json({ message: "Checkout successful" });
  } catch (err) {
    console.error("❌ Error during checkout:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this function to manually update accommodation after successful payment
exports.updateAccommodationAfterPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Find the booking
    const booking = await Booking.findOne({
      _id: bookingId,
      status: "paid"
    });

    if (!booking) {
      return res.status(404).json({
        message: "Paid booking not found"
      });
    }

    // Update accommodation
    const accommodation = await Accommodation.findByIdAndUpdate(
      booking.propertyId,
      {
        customerId: booking.userId,
        status: "Booked"
      },
      { new: true }
    );

    if (!accommodation) {
      return res.status(404).json({
        message: "Accommodation not found"
      });
    }

    res.status(200).json({
      message: "Accommodation updated successfully",
      accommodation,
      booking
    });

  } catch (error) {
    console.error("Error updating accommodation:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Get user's booking for specific accommodation
exports.getUserBookingForAccommodation = async (req, res) => {
  try {
    const { userId, accommodationId } = req.params;

    const booking = await Booking.findOne({
      userId: userId,
      propertyId: accommodationId,
      status: { $in: ["paid", "pending"] } // chỉ lấy booking đã thanh toán hoặc đang pending
    }).populate('propertyId', 'title price');

    if (!booking) {
      return res.status(404).json({ message: "No booking found" });
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error getting user booking:", error);
    res.status(500).json({ message: "Server error" });
  }
};






exports.getUserBookingHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Lấy tất cả booking của user như cũ
    // Dùng .lean() giúp query nhanh hơn và dễ dàng chỉnh sửa object
    const bookings = await Booking.find({ userId })
      .populate('propertyId', 'title price photos location')
      .sort({ createdAt: -1 })
      .lean(); 

    // 2. "LÀM GIÀU" DỮ LIỆU: Thêm thông tin thanh toán vào mỗi booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        // Với mỗi booking, tìm bản ghi Payment tương ứng
        const payment = await Payment.findOne({ bookingId: booking._id })
                                     .select('orderCode amount') // Chỉ lấy 2 trường cần thiết
                                     .lean();

        // Thêm thông tin thanh toán vào object booking và format lại
        return {
          ...booking, // Giữ lại toàn bộ thông tin booking cũ
          paymentInfo: {
            payosOrderCode: payment?.orderCode, // Gán orderCode vào đây!
          },
          // Format các trường khác ngay tại đây cho tiện
          checkInDate: booking.guestInfo?.startDate,
          // Lưu ý: Phần tính toán này nên được làm khi tạo booking để đảm bảo chính xác
          checkOutDate: new Date(new Date(booking.guestInfo?.startDate).getTime() + (parseInt(booking.guestInfo?.leaseDuration) || 1) * 24 * 60 * 60 * 1000),
          guests: booking.guestInfo?.guests || 1,
          totalPrice: payment?.amount || (booking.propertyId?.price * (parseInt(booking.guestInfo?.leaseDuration) || 1)),
        };
      })
    );

    // 3. Trả về dữ liệu đã được làm giàu cho frontend
    res.status(200).json(enrichedBookings);

  } catch (error) {
    console.error("Error getting user booking history:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all bookings for specific accommodation (for owner report)
exports.getBookingsByAccommodation = async (req, res) => {
  try {
    const { accommodationId } = req.params;
    console.log('Getting bookings for accommodation:', accommodationId);

    const bookings = await Booking.find({
      propertyId: accommodationId
    })
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    console.log('Found bookings:', bookings.length);

    // Format data cho owner report
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      customerId: booking.userId, // đây là customer info
      status: booking.status,
      checkInDate: booking.guestInfo?.startDate,
      checkOutDate: new Date(new Date(booking.guestInfo?.startDate).getTime() + (parseInt(booking.guestInfo?.leaseDuration) || 1) * 24 * 60 * 60 * 1000),
      totalPrice: booking.paymentInfo?.amount || 0,
      createdAt: booking.createdAt,
      guestInfo: booking.guestInfo,
      paymentInfo: booking.paymentInfo
    }));

    res.status(200).json(formattedBookings);
  } catch (error) {
    console.error("Error getting bookings by accommodation:", error);
    res.status(500).json({ message: "Server error" });
  }
};