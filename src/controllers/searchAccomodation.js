const BoardingHouse = require('../models/BoardingHouse');

exports.SearchBoardingHouseNoUsingAI = async (req, res) => {
    try {
        const { district, street, addressDetail } = req.query;

        const query = {
            approvedStatus: "approved", // Chỉ lấy boarding house đã được approve
            status: { $ne: "Unavailable" } // Loại bỏ accommodation có status "Unavailable"
        };

        if (district) query["location.district"] = district;
        if (street) query["location.street"] = { $regex: street, $options: "i" };
        if (addressDetail)
            query["location.addressDetail"] = { $regex: addressDetail, $options: "i" };

        // ⛔ Thay vì .find(), chúng ta dùng .aggregate()
        const results = await BoardingHouse.aggregate([
            // 1. $match: Lọc các BoardingHouse khớp với query
            { $match: query },

            // 2. $lookup: Lấy tất cả các 'rooms' liên quan
            {
                $lookup: {
                    from: "rooms", // Tên collection của Room model (thường là số nhiều, chữ thường)
                    localField: "_id",
                    foreignField: "boardingHouseId", // Tên trường trong Room model liên kết với BoardingHouse
                    as: "rooms" // Tên mảng tạm thời chứa các phòng
                }
            },

            // 3. $addFields: Thêm các trường tính toán mới
            {
                $addFields: {
                    // Đếm số phòng có status 'Available'
                    availableRoomsCount: {
                        $size: {
                            $filter: {
                                input: "$rooms",
                                as: "room",
                                // ⚠️ Chú ý: Đảm bảo 'Available' là đúng status cho phòng trống
                                cond: { $eq: ["$$room.status", "Available"] } 
                            }
                        }
                    },
                    // Tìm giá thấp nhất từ mảng rooms
                    // ⚠️ Đảm bảo trường giá là 'price'
                    minPrice: { $min: "$rooms.price" }, 
                    
                    // Tìm giá cao nhất từ mảng rooms
                    maxPrice: { $max: "$rooms.price" }
                }
            },

            // 4. $project (Tùy chọn): Xóa mảng 'rooms' không cần thiết
            // Giúp response gửi về frontend gọn gàng hơn
            {
                $project: {
                    rooms: 0 
                }
            }
        ]);

        res.json(results);
    } catch (err) {
        // Log lỗi ra console của server để dễ debug
        console.error("Search error:", err); 
        res.status(500).json({ error: "Search error", detail: err.message });
    }
};