// models/RoommatePost.js
const mongoose = require('mongoose');
const BoardingHouse = require('./BoardingHouse');

const roommatePostSchema = new mongoose.Schema({
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BoardingHouse',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  intro: String, // giới thiệu bản thân
  genderPreference: { type: String, enum: ['male', 'female', 'other', 'any'], default: 'any' },
  habits: [String], // ví dụ: ["Clean", "Quiet", "Smoker"]
  images: [String], // paths to uploaded images, e.g. "/uploads/roommate/....jpg"
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RoommatePost', roommatePostSchema);
