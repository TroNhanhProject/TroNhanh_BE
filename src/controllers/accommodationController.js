// file TroNhanh_BE/src/controllers/accomodationController.js
const Accommodation = require("../models/Accommodation");
const Payment = require("../models/Payment");
const MembershipPackage = require("../models/MembershipPackage");
const User = require('../models/User')
const Review = require('../models/Reviews')
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
    console.log("[DEBUG] req.files:", req.files);

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
    console.log("[DEBUG] Received ownerId query:", ownerId);

    // only return approved accommodations
    const filter = { approvedStatus: "approved" };
    if (ownerId) filter.ownerId = ownerId;

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
    // only return if approved
    const acc = await Accommodation.findOne({
      _id: req.params.id,
      approvedStatus: "approved",
    })
      .populate("ownerId", "name email")
      .populate("customerId", "name email phone");
    if (!acc)
      return res.status(404).json({ message: "Accommodation not found" });
    res.status(200).json(acc);
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

    const newReview = new Review({
      accommodationId: id,
      user: user._id,
      rating,
      comment,
      purpose,
      weeksAgo: 0,
    });

    await newReview.save();

    res.status(201).json({ review: newReview });
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