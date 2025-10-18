const Booking = require("../models/Booking");
const BoardingHouse = require("../models/BoardingHouse");
const Room = require('../models/Room');

exports.createBooking = async (req, res) => {
  try {
    const { userId, propertyId, guestInfo, startDate, leaseDuration, guests } =
      req.body;

    // Check if the BoardingHouse is approved and available
    const property = await BoardingHouse.findOne({
      _id: propertyId,
      approvedStatus: "approved",
      status: "Available"
    });
    if (!property) {
      return res
        .status(400)
        .json({ message: "BoardingHouse is not available for booking." });
    }

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

// Checkout function to make BoardingHouse available again
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

    // Make BoardingHouse available again
    await BoardingHouse.findByIdAndUpdate(booking.propertyId, {
      customerId: null,
      status: "Available"
    });

    console.log("✅ Customer checked out, BoardingHouse is now available again.");
    res.status(200).json({ message: "Checkout successful" });
  } catch (err) {
    console.error("❌ Error during checkout:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this function to manually update BoardingHouse after successful payment
exports.updateBoardingHouseAfterPayment = async (req, res) => {
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

    // Update BoardingHouse
    const BoardingHouse = await BoardingHouse.findByIdAndUpdate(
      booking.propertyId,
      {
        customerId: booking.userId,
        status: "Booked"
      },
      { new: true }
    );

    if (!BoardingHouse) {
      return res.status(404).json({
        message: "BoardingHouse not found"
      });
    }

    res.status(200).json({
      message: "BoardingHouse updated successfully",
      BoardingHouse,
      booking
    });

  } catch (error) {
    console.error("Error updating BoardingHouse:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// Get user's booking for specific BoardingHouse
exports.getUserBookingForBoardingHouse = async (req, res) => {
  try {
    const { userId, BoardingHouseId } = req.params;

    const booking = await Booking.findOne({
      userId: userId,
      propertyId: BoardingHouseId,
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

// Get all booking history for a user
exports.getUserBookingHistory = async (req, res) => {
  try {
    // ✅ Lấy userId từ req.user (do middleware protect thêm vào)
    const userId = req.user?.id;
    if (!userId) {
      // Trường hợp này không nên xảy ra nếu 'protect' hoạt động đúng
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log(`Getting booking history for user: ${userId}`); // Log ID thực tế

    // ✅ Dùng userId lấy từ req.user để truy vấn
    const bookings = await Booking.find({ userId: userId })
      .populate({
        path: 'boardingHouseId',
        select: 'name photos location',
      })
      .populate({
        path: 'roomId', // Hoặc propertyId
        select: 'roomNumber price area'
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);

  } catch (error) {
    console.error("Error getting user booking history:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all bookings for specific BoardingHouse (for owner report)
exports.getBookingsByBoardingHouse = async (req, res) => {
  try {
    const { BoardingHouseId } = req.params;
    console.log('Getting bookings for BoardingHouse:', BoardingHouseId);

    const bookings = await Booking.find({
      propertyId: BoardingHouseId
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
    console.error("Error getting bookings by BoardingHouse:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.requestBooking = async (req, res) => {
  const { boardingHouseId, roomId } = req.body;
  const userId = req.user.id; // Lấy từ middleware protect

  try {
    const room = await Room.findOne({ _id: roomId, boardingHouseId: boardingHouseId });
    if (!room || room.status !== 'Available') {
      return res.status(400).json({ message: 'Phòng không tồn tại hoặc đã được đặt.' });
    }

    // Kiểm tra xem đã có yêu cầu tương tự chưa
    const existingRequest = await Booking.findOne({
      userId, roomId, boardingHouseId,
      contractStatus: { $in: ['pending_approval', 'approved', 'payment_pending', 'paid'] }
    });
    if (existingRequest) {
      return res.status(400).json({ message: 'Bạn đã có yêu cầu hoặc đã đặt phòng này.' });
    }

    const newBooking = new Booking({
      userId,
      roomId, 
      boardingHouseId,
      contractStatus: 'pending_approval',
    });

    const savedBooking = await newBooking.save();

    // Lấy thông tin chủ nhà để gửi thông báo
    const house = await BoardingHouse.findById(boardingHouseId).select('ownerId');

    if (house && house.ownerId && room) {
      await Notification.create({
        userId: house.ownerId, // Người nhận là chủ nhà
        type: 'new_booking_request',
        message: `${userName} vừa gửi yêu cầu đặt phòng ${room.roomNumber} tại ${house.name}.`,
        link: '/owner/pending-bookings', // Link đến trang duyệt yêu cầu
        relatedBookingId: savedBooking._id
      });
      console.log(`Đã tạo thông báo cho owner ${house.ownerId}`);
    } else {
      console.warn("Không thể tạo thông báo: Thiếu thông tin nhà trọ hoặc phòng.");
    }
    res.status(201).json({ message: 'Yêu cầu đặt phòng đã được gửi thành công.', booking: savedBooking });

  } catch (error) {
    console.error("[REQUEST BOOKING ERROR]", error);
    res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu.' });
  }
};

exports.getPendingBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    // Tìm các nhà trọ của owner này
    const ownerHouses = await BoardingHouse.find({ ownerId }).select('_id');
    const houseIds = ownerHouses.map(h => h._id);

    // Tìm các booking đang chờ duyệt của các nhà trọ đó
    const pendingBookings = await Booking.find({
      boardingHouseId: { $in: houseIds },
      contractStatus: 'pending_approval'
    })
      .populate('userId', 'name email phone') // Lấy thông tin người thuê
      .populate('roomId', 'roomNumber price area') // Lấy thông tin phòng
      .sort({ createdAt: -1 });

    res.status(200).json(pendingBookings);
  } catch (error) {
    console.error("[GET PENDING BOOKINGS ERROR]", error);
    res.status(500).json({ message: 'Lỗi server khi lấy yêu cầu.' });
  }
};


exports.updateBookingApproval = async (req, res) => {
  const { bookingId } = req.params;
  const { status, reason } = req.body; // status: 'approved' hoặc 'rejected'
  const ownerId = req.user.id;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
  }
  if (status === 'rejected' && !reason) {
    return res.status(400).json({ message: 'Vui lòng cung cấp lý do từ chối.' });
  }

  try {
    const booking = await Booking.findById(bookingId).populate({
      path: 'boardingHouseId',
      select: 'ownerId' // Chỉ cần ownerId để kiểm tra quyền
    });

    if (!booking) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu đặt phòng.' });
    }
    if (booking.boardingHouseId.ownerId.toString() !== ownerId) {
      return res.status(403).json({ message: 'Bạn không có quyền duyệt yêu cầu này.' });
    }
    if (booking.contractStatus !== 'pending_approval') {
      return res.status(400).json({ message: 'Yêu cầu này đã được xử lý.' });
    }

    booking.contractStatus = status;
    if (status === 'approved') {
      booking.approvedAt = new Date();
      // KHÔNG đổi trạng thái phòng ở đây, chờ thanh toán
    } else {
      booking.rejectedAt = new Date();
      booking.rejectionReason = reason;
    }

    await booking.save();

    // TODO: Gửi thông báo đến người thuê (booking.userId) về quyết định
    // Ví dụ: await notificationService.notifyTenantBookingStatus(booking.userId, booking);

    res.status(200).json({ message: `Đã ${status === 'approved' ? 'chấp thuận' : 'từ chối'} yêu cầu.`, booking });

  } catch (error) {
    console.error("[UPDATE BOOKING APPROVAL ERROR]", error);
    res.status(500).json({ message: 'Lỗi server khi duyệt yêu cầu.' });
  }
};

exports.cancelBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    // ✅ SỬ DỤNG findByIdAndUpdate ĐỂ AN TOÀN HƠN
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: bookingId,          // Tìm đúng booking
        userId: userId,          // Đảm bảo đúng người dùng
        contractStatus: 'pending_approval' // Đảm bảo đúng trạng thái có thể hủy
      },
      {
        // Chỉ cập nhật trường này
        contractStatus: 'cancelled_by_tenant'
      },
      { new: true } // Trả về document đã được cập nhật
    );

    // --- Validation ---
    if (!updatedBooking) {
      // Lý do không tìm thấy có thể là:
      // 1. Sai bookingId
      // 2. Không phải booking của user này
      // 3. Booking không còn ở trạng thái 'pending_approval'
      // --> Kiểm tra lại booking gốc để biết lý do chính xác (tùy chọn)
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu đặt phòng.' });
      } else if (existingBooking.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Bạn không có quyền hủy yêu cầu này.' });
      } else if (existingBooking.contractStatus !== 'pending_approval') {
        return res.status(400).json({ message: 'Không thể hủy yêu cầu đã được xử lý.' });
      } else {
        // Lỗi không xác định khác
        return res.status(500).json({ message: 'Không thể cập nhật yêu cầu.' });
      }
    }

    res.status(200).json({ message: 'Đã hủy yêu cầu đặt phòng thành công.', booking: updatedBooking });

  } catch (error) {
    console.error("[CANCEL BOOKING ERROR]", error);
    res.status(500).json({ message: 'Lỗi server khi hủy yêu cầu.' });
  }
};