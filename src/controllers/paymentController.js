// file TroNhanh_BE/src/controllers/paymentController.js
const Payment = require('../models/Payment');
const MembershipPackage = require('../models/MembershipPackage');
const User = require('../models/User');

exports.getCurrentMembershipOfUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        const latestPayment = await Payment.findOne({
            ownerId: userId,
            status: 'Paid'
        }).sort({ createAt: -1 }).populate('membershipPackageId');

        if (!latestPayment) {
            // User chưa có membership nào, cập nhật trạng thái thành 'none'
            const currentUser = await User.findById(userId);
            if (currentUser && currentUser.isMembership !== 'none') {
                await User.findByIdAndUpdate(userId, {
                    isMembership: 'none'
                });
            }

            return res.status(200).json({ package: null });
        }

        const duration = latestPayment.membershipPackageId?.duration || 0;
        const createdAt = latestPayment.createAt;
        const expiredAt = new Date(createdAt.getTime() + duration * 24 * 60 * 60 * 1000);

        // Kiểm tra và cập nhật trạng thái membership trong User collection
        const now = new Date();
        const isExpired = now > expiredAt;

        const currentUser = await User.findById(userId);
        if (currentUser) {
            const newMembershipStatus = isExpired ? 'inactive' : 'active';

            if (currentUser.isMembership !== newMembershipStatus) {
                await User.findByIdAndUpdate(userId, {
                    isMembership: newMembershipStatus
                }, { new: true });
            }
        }

        return res.status(200).json({
            package: latestPayment.membershipPackageId,
            expiredAt,
            isExpired
        });
    } catch (err) {
        console.error('❌ Lỗi khi lấy membership hiện tại:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Function để cập nhật trạng thái membership cho tất cả users
exports.updateAllUsersMembershipStatus = async (req, res) => {
    try {
        const users = await User.find({ role: 'owner', isDeleted: false });
        let updatedCount = 0;

        for (const user of users) {
            const latestPayment = await Payment.findOne({
                ownerId: user._id,
                status: 'Paid'
            }).sort({ createAt: -1 }).populate('membershipPackageId');

            let newStatus = 'none';

            if (latestPayment) {
                const duration = latestPayment.membershipPackageId?.duration || 0;
                const createdAt = latestPayment.createAt;
                const expiredAt = new Date(createdAt.getTime() + duration * 24 * 60 * 60 * 1000);
                const now = new Date();

                newStatus = now > expiredAt ? 'inactive' : 'active';
            }

            if (user.isMembership !== newStatus) {
                await User.findByIdAndUpdate(user._id, {
                    isMembership: newStatus
                });
                updatedCount++;
            }
        }

        return res.status(200).json({
            message: `Đã cập nhật trạng thái membership cho ${updatedCount} users`,
            totalUsers: users.length,
            updatedCount
        });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật trạng thái membership:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};