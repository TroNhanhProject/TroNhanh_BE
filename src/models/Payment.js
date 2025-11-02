const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userMembershipId: { // <--- THÊM KHỐI NÀY
type: mongoose.Schema.Types.ObjectId,
ref: 'Membership', // Tên model Membership của bạn
 default: null
},
  membershipPackageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MembershipPackage",
     default: null,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  amount: {
    type: Number,
    min: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Cancelled", "Refunded","Expired"],
    default: "Pending",
  },
  orderCode: {
    type: Number, // PayOS orderCode 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  expiredAt: { type: Date },

});

module.exports = mongoose.model("Payment", PaymentSchema);
