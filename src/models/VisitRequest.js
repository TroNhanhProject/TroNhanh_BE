
const mongoose = require("mongoose");

const VisitRequestSchema = new mongoose.Schema({
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoardingHouse",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedDateTime: {
    type: Date,
    required: true,
  },
  message: String,
  ownerNotes: String,
  status: {
    type: String,
    enum: ["pending", "confirmed", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("VisitRequest", VisitRequestSchema);
