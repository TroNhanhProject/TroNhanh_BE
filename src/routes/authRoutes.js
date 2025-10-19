const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerValidator, loginValidator, resetPasswordValidator } = require('../middleware/authValidator')

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, authController.resetPassword);
router.post("/google-login", authController.googleLogin);
router.post('/setRole',authController.setRole);
module.exports = router;