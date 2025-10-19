// Thêm Membership vào imports
const Payment = require('../models/Payment');
const MembershipPackage = require('../models/MembershipPackage');
const User = require('../models/User');
const Membership = require('../models/Membership'); // <-- THÊM DÒNG NÀY

exports.getCurrentMembershipOfUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const now = new Date();

        // 1. Tìm gói membership 'Active' của user
        const activeMembership = await Membership.findOne({
            ownerId: userId,
            status: 'Active'
        }).populate('packageId'); // Lấy thông tin gói

        let newStatus;
        let isExpired = true;

        if (!activeMembership) {
            // Không có gói 'Active'. Kiểm tra xem họ đã từng có gói nào chưa.
            const anyMembershipEver = await Membership.findOne({ ownerId: userId });
            newStatus = anyMembershipEver ? 'inactive' : 'none';

            // Cập nhật trạng thái 'cached' trên User
            await User.findByIdAndUpdate(userId, { isMembership: newStatus });
            return res.status(200).json({ package: null, isExpired: true, status: newStatus });
        }

        // 2. Nếu có gói 'Active', kiểm tra ngày hết hạn
        if (now > activeMembership.endDate) {
            // Đã hết hạn
            newStatus = 'inactive';
            isExpired = true;
            // Cập nhật trạng thái của chính bản ghi Membership
            await Membership.findByIdAndUpdate(activeMembership._id, { status: 'Inactive' });
        } else {
            // Vẫn còn hạn
            newStatus = 'active';
            isExpired = false;
        }

        // 3. Cập nhật trạng thái 'cached' trên User nếu nó thay đổi
        const currentUser = await User.findById(userId);
        if (currentUser && currentUser.isMembership !== newStatus) {
            await User.findByIdAndUpdate(userId, { isMembership: newStatus });
        }

        return res.status(200).json({
            package: activeMembership.packageId,
            expiredAt: activeMembership.endDate, // Lấy ngày hết hạn ĐÚNG từ DB
            isExpired,
            status: newStatus
        });

    } catch (err) {
        console.error('❌ Lỗi khi lấy membership hiện tại:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// Cập nhật lại cron job để dùng logic tương tự
exports.updateAllUsersMembershipStatus = async (req, res) => {
    try {
        const users = await User.find({ role: 'owner', isDeleted: false });
        let updatedCount = 0;
        const now = new Date();

        for (const user of users) {
            // 1. Tìm gói 'Active'
            const activeMembership = await Membership.findOne({
                ownerId: user._id,
                status: 'Active'
            });

            let newStatus;

            if (activeMembership) {
                // 2. Nếu có, kiểm tra ngày
                if (now > activeMembership.endDate) {
                    newStatus = 'inactive';
                    // Cập nhật bản ghi Membership
                    await Membership.findByIdAndUpdate(activeMembership._id, { status: 'Inactive' });
                } else {
                    newStatus = 'active';
                }
            } else {
                // 3. Nếu không, kiểm tra xem đã từng có chưa
                const anyMembershipEver = await Membership.findOne({ ownerId: user._id });
                newStatus = anyMembershipEver ? 'inactive' : 'none';
            }

            // 4. Cập nhật User nếu trạng thái thay đổi
            if (user.isMembership !== newStatus) {
                await User.findByIdAndUpdate(user._id, {
                    isMembership: newStatus
                });
                updatedCount++;
            }
        }

        return res.status(200).json({
            message: `Đã kiểm tra và cập nhật trạng thái cho ${updatedCount} users.`,
            totalUsers: users.length,
            updatedCount
        });
    } catch (err) {
        console.error('❌ Lỗi khi cập nhật trạng thái membership:', err);
        return res.status(500).json({ message: 'Server error' });
    }
}; 