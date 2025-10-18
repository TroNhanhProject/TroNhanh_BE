// file TroNhanh_BE/src/controllers/accomodationController.js
const Accommodation = require("../models/Accommodation");
const Payment = require("../models/Payment");
const MembershipPackage = require("../models/MembershipPackage");
const User = require('../models/User')
const Review = require('../models/Reviews')
const Booking = require('../models/Booking')
exports.createAccommodation = async (req, res) => {
  try {
    const { ownerId, title, description, price, status } = req.body;
    const locationRaw = req.body.location || "{}";

    // 🔒 Kiểm tra membership hiện tại
    const latestPayment = await Payment.findOne({
      ownerId,
      status: "Paid",
    })
      .sort({ createAt: -1 })
      .populate("membershipPackageId");

    if (!latestPayment) {
      return res
        .status(403)
        .json({ message: "Bạn cần mua gói thành viên trước khi đăng chỗ ở." });
    }

    const durationDays = latestPayment.membershipPackageId?.duration || 0;
    const createdAt = latestPayment.createAt; // ✅ đúng key

    const expiredAt = new Date(
      createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    if (new Date() > expiredAt) {
      return res.status(403).json({
        message:
          "Gói thành viên của bạn đã hết hạn. Hãy gia hạn để tiếp tục đăng chỗ ở.",
      });
    }

    // 🔒 Kiểm tra số lượng accommodations hiện tại vs giới hạn của gói
    const membershipPackage = latestPayment.membershipPackageId;
    const postsAllowed = membershipPackage.postsAllowed || 0;

    // Đếm số accommodations hiện tại của owner (chỉ tính những cái active, không tính deleted)
    const currentAccommodationsCount = await Accommodation.countDocuments({
      ownerId,
      // Không cần filter theo approvedStatus vì owner có thể có accommodations pending approval
    });

    if (currentAccommodationsCount >= postsAllowed) {
      return res.status(403).json({
        message: `Bạn đã đạt giới hạn ${postsAllowed} accommodations của gói "${membershipPackage.packageName}". Hãy nâng cấp gói thành viên để đăng thêm chỗ ở.`,
        currentCount: currentAccommodationsCount,
        allowedCount: postsAllowed,
        packageName: membershipPackage.packageName
      });
    }

    // ✅ Tiếp tục tạo accommodation nếu membership còn hiệu lực
    let location;
    try {
      location = JSON.parse(locationRaw);
    } catch (e) {
      return res.status(400).json({ message: "Invalid location format" });
    }

    const photoPaths =
      req.files?.map((file) => `/uploads/accommodation/${file.filename}`) || [];

    const newAccommodation = new Accommodation({
      ownerId,
      title,
      description,
      price,
      status,
      location,
      photos: photoPaths,
    });

    await newAccommodation.save();

    res.status(201).json({
      message: "Accommodation created successfully",
      data: newAccommodation,
    });
  } catch (err) {
    console.error("[CREATE ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAccommodation = async (req, res) => {
  try {
    const { title, description, price, status } = req.body;
    const location = JSON.parse(req.body.location || "{}");
    const photoPaths =
      req.files?.map((file) => `/uploads/accommodation/${file.filename}`) || [];

    const updateData = {
      title,
      description,
      price,
      status,
      location,
      updatedAt: Date.now(),
    };

    if (photoPaths.length > 0) {
      updateData.photos = photoPaths;
    }

    const updated = await Accommodation.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Accommodation not found" });
    }

    res.status(200).json({
      message: "Accommodation updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("[UPDATE ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllAccommodations = async (req, res) => {
  try {
    const { ownerId } = req.query;

    // Base filter - only approved accommodations
    const filter = { approvedStatus: "approved" };

    if (ownerId) {
      // Owner request - show all accommodations including Unavailable
      filter.ownerId = ownerId;
    } else {
      // Customer request - exclude Unavailable accommodations
      filter.status = { $ne: "Unavailable" };
    }

    const accommodations = await Accommodation.find(filter)
      .populate("ownerId", "name email")
      .populate("customerId", "name email phone");

    res.status(200).json(accommodations);
  } catch (err) {
    console.error("[GET ALL ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAccommodationById = async (req, res) => {
  try {
    const { viewAs } = req.query; // Thêm query parameter để phân biệt owner/customer

    // Base filter
    const filter = {
      _id: req.params.id,
      approvedStatus: "approved"
    };

    // Nếu không phải owner view, thì loại bỏ Unavailable accommodations
    if (viewAs !== 'owner') {
      filter.status = { $ne: "Unavailable" };
    }

    const acc = await Accommodation.findOne(filter)
      .populate("ownerId", "name email")
      .populate("customerId", "name email phone");

    if (!acc)
      return res.status(404).json({ message: "Accommodation not found" });
if (!acc.ownerId) {
    console.error(`Data error: Accommodation ${acc._id} has no valid owner.`);
    // Trả về 404 vì dữ liệu nhà trọ này không hợp lệ (thiếu chủ)
    return res.status(404).json({ message: "Accommodation data is corrupted (owner missing)." });
  }
    // Fetch reviews separately từ Review collection
    const reviews = await Review.find({ accommodationId: req.params.id })
      .populate('customerId', 'name avatar')
      .sort({ createdAt: -1 });

    // Thêm reviews vào accommodation object
    const accommodationWithReviews = {
      ...acc.toObject(),
      reviews: reviews
    };

    res.status(200).json(accommodationWithReviews);
  } catch (err) {
    console.error("[GET BY ID ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteAccommodation = async (req, res) => {
  try {
    // Kiểm tra accommodation trước khi xóa
    const accommodation = await Accommodation.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: "Accommodation not found" });
    }

    // Không cho phép xóa nếu đang trong trạng thái Booked
    if (accommodation.status === "Booked") {
      return res.status(400).json({
        message: "Không thể xóa accommodation này vì đang có khách hàng đặt phòng!"
      });
    }

    const deleted = await Accommodation.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Accommodation deleted successfully" });
  } catch (err) {
    console.error("[DELETE ERROR]", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await Review.find({ accommodationId: id }).populate('user', 'name avatar');
    res.status(200).json({ reviews });
  } catch (error) {
    console.error("Error getting reviews:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Thêm review mới cho accommodation
exports.submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, purpose } = req.body;

    if (!rating || !comment || !purpose) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const accommodation = await Accommodation.findById(id);
    if (!accommodation) {
      return res.status(404).json({ message: "Accommodation not found" });
    }

    const user = await User.findById(req.user.id);

    // ✅ Kiểm tra xem user đã booking accommodation này chưa
    const userBooking = await Booking.findOne({
      userId: user._id,
      propertyId: id,
      status: { $in: ['paid', 'completed'] } // Chỉ cho phép review nếu đã thanh toán hoặc hoàn thành
    });

    if (!userBooking) {
      return res.status(403).json({
        message: "You can only review accommodations that you have booked and stayed at."
      });
    }

    // ✅ Kiểm tra xem user đã review accommodation này chưa
    const existingReview = await Review.findOne({
      accommodationId: id,
      customerId: user._id
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this accommodation."
      });
    }

    const newReview = new Review({
      accommodationId: id,  // Thêm accommodationId
      customerId: user._id, // Thêm customerId
      user: user._id,
      rating,
      comment,
      purpose,
      weeksAgo: 0,
    });

    await newReview.save();

    // Populate customer info trước khi trả về
    const populatedReview = await Review.findById(newReview._id)
      .populate('customerId', 'name avatar');

    res.status(201).json({ review: populatedReview });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Sửa review
exports.editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment, purpose } = req.body;

    if (!rating || !comment || !purpose) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Chỉ cho phép user đã tạo review được sửa
    if (String(review.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to edit this review" });
    }

    review.rating = rating;
    review.comment = comment;
    review.purpose = purpose;
    await review.save();

    res.status(200).json({ review });
  } catch (error) {
    console.error("Error editing review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Xóa review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Chỉ cho phép user đã tạo review được xóa
    if (String(review.user) !== String(req.user.id)) {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// API cho owner xem tất cả accommodations với ratings
exports.getOwnerAccommodationsWithRatings = async (req, res) => {
  try {
    const ownerId = req.user.id; // Lấy từ auth middleware

    // Lấy tất cả accommodations của owner
    const accommodations = await Accommodation.find({ ownerId })
      .select('_id title status createdAt');

    // Tính rating cho từng accommodation
    const accommodationsWithRatings = await Promise.all(
      accommodations.map(async (acc) => {
        const reviews = await Review.find({ accommodationId: acc._id });

        let avgRating = 0;
        let totalReviews = reviews.length;

        if (totalReviews > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          avgRating = (totalRating / totalReviews).toFixed(1);
        }

        return {
          _id: acc._id,
          title: acc.title,
          status: acc.status,
          averageRating: parseFloat(avgRating),
          totalReviews,
          createdAt: acc.createdAt
        };
      })
    );

    res.status(200).json({
      success: true,
      accommodations: accommodationsWithRatings
    });
  } catch (error) {
    console.error("Error getting owner accommodations with ratings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// API cho owner xem chi tiết ratings của 1 accommodation
exports.getAccommodationRatingsForOwner = async (req, res) => {
  try {
    const { id } = req.params; // Đổi từ accommodationId thành id
    const ownerId = req.user.id;

    // Kiểm tra accommodation có thuộc về owner không
    const accommodation = await Accommodation.findOne({
      _id: id, // Đổi từ accommodationId thành id
      ownerId: ownerId
    });

    if (!accommodation) {
      return res.status(404).json({
        success: false,
        message: "Accommodation not found or not yours"
      });
    }

    // Lấy tất cả reviews cho accommodation này
    const reviews = await Review.find({ accommodationId: id }) // Đổi từ accommodationId thành id
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 });

    // Tính average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      avgRating = (totalRating / reviews.length).toFixed(1);
    }

    res.status(200).json({
      success: true,
      accommodationTitle: accommodation.title,
      ratings: reviews,
      avgRating: parseFloat(avgRating),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error("❌ [DEBUG Backend] Error getting accommodation ratings:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// API để lấy recent bookings cho owner statistics
exports.getOwnerRecentBookings = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const limit = parseInt(req.query.limit) || 10; // Default 10 recent bookings

    // Lấy tất cả accommodations của owner
    const ownerAccommodations = await Accommodation.find({ ownerId }).select('_id');
    const accommodationIds = ownerAccommodations.map(acc => acc._id);

    // Lấy recent bookings cho tất cả accommodations của owner
    const recentBookings = await Booking.find({
      propertyId: { $in: accommodationIds }
    })
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit);

    // Format data cho frontend
    const formattedBookings = recentBookings.map(booking => ({
      key: booking._id,
      customerName: booking.userId?.name || 'Unknown Customer',
      accommodationTitle: booking.propertyId?.title || 'Unknown Property',
      accommodationId: booking.propertyId?._id || booking.propertyId, // Thêm accommodationId
      bookingDate: booking.createdAt,
      amount: booking.paymentInfo?.amount || 0,
      status: booking.status,
      bookingId: booking._id // Thêm bookingId để dễ reference
    }));

    res.status(200).json({
      success: true,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error("Error getting owner recent bookings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// API để lấy top accommodations với booking count và rating
exports.getOwnerTopAccommodations = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const limit = parseInt(req.query.limit) || 5; // Default top 5

    // Lấy tất cả accommodations của owner
    const ownerAccommodations = await Accommodation.find({ ownerId })
      .select('_id title');

    // Tính toán statistics cho từng accommodation
    const accommodationStats = await Promise.all(
      ownerAccommodations.map(async (acc) => {
        // Đếm số bookings
        const bookingCount = await Booking.countDocuments({
          propertyId: acc._id,
          status: { $in: ['paid', 'completed'] }
        });

        // Tính total revenue từ bookings
        const bookings = await Booking.find({
          propertyId: acc._id,
          status: { $in: ['paid', 'completed'] }
        });
        const totalRevenue = bookings.reduce((sum, booking) => {
          return sum + (booking.paymentInfo?.amount || 0);
        }, 0);

        // Tính average rating từ reviews
        const reviews = await Review.find({ accommodationId: acc._id });
        let avgRating = 0;
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          avgRating = (totalRating / reviews.length);
        }

        return {
          key: acc._id,
          title: acc.title,
          bookings: bookingCount,
          revenue: totalRevenue,
          rating: parseFloat(avgRating.toFixed(1))
        };
      })
    );

    // Sắp xếp theo số booking giảm dần
    const topAccommodations = accommodationStats
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, limit);

    res.status(200).json({
      success: true,
      accommodations: topAccommodations
    });
  } catch (error) {
    console.error("Error getting owner top accommodations:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// API để lấy owner statistics tổng hợp
exports.getOwnerStatistics = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Lấy tất cả accommodations của owner (chỉ những cái đã approved)
    const accommodations = await Accommodation.find({
      ownerId,
      approvedStatus: "approved"
    });
    const accommodationIds = accommodations.map(acc => acc._id);

    const totalAccommodations = accommodations.length;
    const availableAccommodations = accommodations.filter(acc => acc.status === 'Available').length;
    const bookedAccommodations = accommodations.filter(acc => acc.status === 'Booked').length;
    const unavailableAccommodations = accommodations.filter(acc => acc.status === 'Unavailable').length;

    // Tính tổng doanh thu từ bookings
    const allBookings = await Booking.find({
      propertyId: { $in: accommodationIds },
      status: { $in: ['paid', 'completed'] }
    });

    const totalRevenue = allBookings.reduce((sum, booking) => {
      return sum + (booking.paymentInfo?.amount || 0);
    }, 0);

    // Tính doanh thu tháng này
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyBookings = await Booking.find({
      propertyId: { $in: accommodationIds },
      status: { $in: ['paid', 'completed'] },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const monthlyRevenue = monthlyBookings.reduce((sum, booking) => {
      return sum + (booking.paymentInfo?.amount || 0);
    }, 0);

    const totalBookings = allBookings.length;

    res.status(200).json({
      success: true,
      statistics: {
        totalAccommodations,
        availableAccommodations,
        bookedAccommodations,
        unavailableAccommodations,
        totalRevenue,
        monthlyRevenue,
        totalBookings
      }
    });
  } catch (error) {
    console.error("Error getting owner statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Owner Current Membership
exports.getOwnerCurrentMembership = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Lấy payment gần nhất có status "Paid"
    const latestPayment = await Payment.findOne({
      ownerId,
      status: "Paid",
    })
      .sort({ createAt: -1 })
      .populate("membershipPackageId");

    if (!latestPayment || !latestPayment.membershipPackageId) {
      return res.status(200).json({
        success: true,
        membership: {
          packageName: "No Active Membership",
          isActive: false,
          expiredAt: null
        }
      });
    }

    const membershipPackage = latestPayment.membershipPackageId;
    const durationDays = membershipPackage.duration || 0;
    const createdAt = latestPayment.createAt;
    const expiredAt = new Date(
      createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    const currentDate = new Date();
    const isActive = currentDate <= expiredAt;

    res.status(200).json({
      success: true,
      membership: {
        packageName: membershipPackage.packageName || membershipPackage.name || "Unknown Package",
        price: membershipPackage.price || 0,
        duration: durationDays,
        isActive,
        purchaseDate: createdAt,
        expiredAt,
        description: membershipPackage.description || ""
      }
    });
  } catch (error) {
    console.error("Error getting owner current membership:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}


// API để lấy doanh thu theo từng tháng của owner
exports.getOwnerMonthlyRevenue = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { months = 6 } = req.query; // Mặc định lấy 6 tháng gần nhất

    // Lấy tất cả accommodations của owner
    const accommodations = await Accommodation.find({ ownerId });
    const accommodationIds = accommodations.map(acc => acc._id);

    if (accommodationIds.length === 0) {
      return res.status(200).json({
        success: true,
        monthlyRevenue: []
      });
    }

    // Tạo mảng các tháng cần tính
    const currentDate = new Date();
    const monthlyRevenueData = [];

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

      // Lấy tất cả bookings trong tháng này
      const monthlyBookings = await Booking.find({
        propertyId: { $in: accommodationIds },
        status: { $in: ['paid', 'completed'] },
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });

      // Tính tổng doanh thu trong tháng - thử nhiều trường dữ liệu
      const revenue = monthlyBookings.reduce((sum, booking) => {
        // Thử nhiều cách lấy amount
        const amount = booking.paymentInfo?.amount || booking.totalPrice || booking.amount || 0;
        return sum + amount;
      }, 0);

      // Format tên tháng
      const monthName = targetDate.toLocaleDateString('vi-VN', {
        month: 'short',
        year: 'numeric'
      });

      monthlyRevenueData.push({
        month: monthName,
        revenue: revenue,
        bookingsCount: monthlyBookings.length,
        year: targetDate.getFullYear(),
        monthNumber: targetDate.getMonth() + 1
      });
    }

    res.status(200).json({
      success: true,
      monthlyRevenue: monthlyRevenueData
    });
  } catch (error) {
    console.error("Error getting owner monthly revenue:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Owner Membership Info with Accommodation Count
exports.getOwnerMembershipInfo = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Lấy membership hiện tại
    const latestPayment = await Payment.findOne({
      ownerId,
      status: "Paid",
    })
      .sort({ createAt: -1 })
      .populate("membershipPackageId");

    if (!latestPayment || !latestPayment.membershipPackageId) {
      return res.status(200).json({
        success: true,
        membershipInfo: {
          hasActiveMembership: false,
          packageName: "No Active Membership",
          postsAllowed: 0,
          currentPostsCount: 0,
          remainingPosts: 0,
          isExpired: true
        }
      });
    }

    const membershipPackage = latestPayment.membershipPackageId;
    const durationDays = membershipPackage.duration || 0;
    const createdAt = latestPayment.createAt;
    const expiredAt = new Date(
      createdAt.getTime() + durationDays * 24 * 60 * 60 * 1000
    );

    const isExpired = new Date() > expiredAt;

    // Đếm số accommodations hiện tại
    const currentPostsCount = await Accommodation.countDocuments({
      ownerId
    });

    const postsAllowed = membershipPackage.postsAllowed || 0;
    const remainingPosts = Math.max(0, postsAllowed - currentPostsCount);

    res.status(200).json({
      success: true,
      membershipInfo: {
        hasActiveMembership: !isExpired,
        packageName: membershipPackage.packageName || membershipPackage.name,
        postsAllowed,
        currentPostsCount,
        remainingPosts,
        isExpired,
        expiredAt,
        purchaseDate: createdAt
      }
    });
  } catch (error) {
    console.error("Error getting owner membership info:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
