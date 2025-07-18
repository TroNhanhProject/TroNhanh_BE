const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema(
  {
    user: {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: String,
      avatar: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    comment: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
    },
    weeksAgo: {
      type: Number,
    },
  }
  // { _id: false } // avoid nested review _id
);

module.exports = mongoose.model('Review', reviewSchema);
