const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['admin', 'owner', 'customer', 'pending'], // pending = chưa chọn role
      default: 'pending'
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return this.provider === 'local';
      }
    },
    phone: {
      type: String,
      trim: true,
      required: function () {
        return this.provider === 'local';
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    },
    avatar: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'inactive'
    },
    verified: {
      type: Boolean,
      default: false
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    isMembership: {
      type: String,
      enum: ['active', 'inactive', 'none'],
      default: 'none'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    googleId: {
      type: String,
      default: null
    },
    provider: {
      type: String,
      enum: ['local', 'google'],
      required: true,
      default: 'local'
    }
  },
  {
    timestamps: true
  }
);

// Hash password trước khi lưu (chỉ local)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh password (chỉ local)
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // user Google không có password
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
