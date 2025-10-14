/**
 * Tên file: roomController.js
 * Chức năng: Quản lý các hoạt động liên quan đến từng phòng trọ (Room) riêng lẻ.
 * - Thêm phòng mới vào một nhà trọ có sẵn.
 * - Lấy thông tin chi tiết một phòng.
 * - Cập nhật thông tin một phòng.
 * - Xóa một phòng.
 */

const Room = require('../models/Room');
const BoardingHouse = require('../models/BoardingHouse');
const Booking = require('../models/Booking');

// ================================================================
// SECTION: QUẢN LÝ PHÒNG (ROOM)
// ================================================================

/**
 * @description Thêm một hoặc nhiều phòng mới vào một nhà trọ đã tồn tại.
 * @route POST /api/boarding-houses/:boardingHouseId/rooms
 * @access Owner
 */
exports.addRoomsToBoardingHouse = async (req, res) => {
    try {
        const { boardingHouseId } = req.params;
        const roomsData = req.body.rooms; // Mong đợi một mảng các phòng trong body: { rooms: [...] }

        if (!Array.isArray(roomsData) || roomsData.length === 0) {
            return res.status(400).json({ message: "Dữ liệu phòng không hợp lệ. Vui lòng cung cấp một mảng các phòng." });
        }

        // 1. Kiểm tra xem nhà trọ có tồn tại và thuộc sở hữu của người dùng không
        const boardingHouse = await BoardingHouse.findById(boardingHouseId);
        if (!boardingHouse) {
            return res.status(404).json({ message: "Không tìm thấy nhà trọ." });
        }

        // Security check: Đảm bảo chỉ chủ sở hữu mới có quyền thêm phòng
        if (boardingHouse.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này." });
        }

        // 2. Chuẩn bị dữ liệu phòng mới và liên kết với nhà trọ
        const newRooms = roomsData.map(room => ({
            ...room,
            boardingHouseId: boardingHouseId, // Gán ID nhà trọ cho mỗi phòng
        }));

        // 3. Lưu các phòng mới vào database
        const createdRooms = await Room.insertMany(newRooms);

        res.status(201).json({
            message: `Đã thêm thành công ${createdRooms.length} phòng vào nhà trọ.`,
            data: createdRooms,
        });

    } catch (err) {
        console.error("[ADD ROOMS ERROR]", err);
        // Xử lý lỗi trùng lặp số phòng
        if (err.code === 11000) {
            return res.status(409).json({ message: "Lỗi: Số phòng đã tồn tại trong nhà trọ này. Vui lòng kiểm tra lại." });
        }
        res.status(500).json({ message: "Lỗi máy chủ khi thêm phòng." });
    }
};

/**
 * @description Lấy thông tin chi tiết của một phòng.
 * @route GET /api/rooms/:id
 * @access Public
 */
exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate({
                path: 'boardingHouseId',
                select: 'name location amenities ownerId', // Lấy các trường cần thiết từ nhà trọ
                populate: {
                    path: 'ownerId',
                    select: 'name email phone' // Lấy thông tin chủ trọ
                }
            });

        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng trọ." });
        }

        res.status(200).json(room);
    } catch (err) {
        console.error("[GET ROOM BY ID ERROR]", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
};

/**
 * @description Cập nhật thông tin của một phòng.
 * @route PUT /api/rooms/:id
 * @access Owner
 */
exports.updateRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const updateData = req.body;

        // 1. Tìm phòng cần cập nhật
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng." });
        }

        // 2. Lấy thông tin nhà trọ chứa phòng đó để kiểm tra quyền sở hữu
        const boardingHouse = await BoardingHouse.findById(room.boardingHouseId);
        if (boardingHouse.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa phòng này." });
        }

        // Loại bỏ các trường không được phép cập nhật trực tiếp
        delete updateData.boardingHouseId;
        delete updateData.customerId;

        // 3. Cập nhật phòng
        const updatedRoom = await Room.findByIdAndUpdate(roomId, updateData, { new: true, runValidators: true });

        res.status(200).json({
            message: "Cập nhật thông tin phòng thành công.",
            data: updatedRoom,
        });

    } catch (err) {
        console.error("[UPDATE ROOM ERROR]", err);
        res.status(500).json({ message: "Lỗi máy chủ khi cập nhật phòng." });
    }
};

/**
 * @description Xóa một phòng trọ.
 * @route DELETE /api/rooms/:id
 * @access Owner
 */
exports.deleteRoom = async (req, res) => {
    try {
        const roomId = req.params.id;

        // 1. Tìm phòng và kiểm tra quyền sở hữu tương tự như hàm update
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Không tìm thấy phòng." });
        }

        const boardingHouse = await BoardingHouse.findById(room.boardingHouseId);
        if (boardingHouse.ownerId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Bạn không có quyền xóa phòng này." });
        }

        // 2. Kiểm tra xem phòng có đang được đặt không
        if (room.status === 'Booked') {
            return res.status(400).json({ message: "Không thể xóa phòng đang có người thuê." });
        }

        // (Tùy chọn) Kiểm tra xem có booking nào liên quan không
        const existingBooking = await Booking.findOne({ propertyId: roomId });
        if (existingBooking) {
            return res.status(400).json({ message: "Không thể xóa phòng đã có lịch sử đặt. Vui lòng chuyển trạng thái thành 'Không có sẵn' (Unavailable) thay vì xóa." });
        }

        // 3. Tiến hành xóa
        await Room.findByIdAndDelete(roomId);

        res.status(200).json({ message: "Xóa phòng thành công." });

    } catch (err) {
        console.error("[DELETE ROOM ERROR]", err);
        res.status(500).json({ message: "Lỗi máy chủ khi xóa phòng." });
    }
};

/**
 * @description Lấy tất cả các phòng của một nhà trọ cụ thể.
 * @route GET /api/boarding-houses/:boardingHouseId/rooms
 * @access Public
 */
exports.getAllRoomsByBoardingHouse = async (req, res) => {
    try {
        const { boardingHouseId } = req.params;

        const rooms = await Room.find({ boardingHouseId: boardingHouseId });

        if (!rooms) {
            return res.status(404).json({ message: "Không tìm thấy phòng nào cho nhà trọ này." });
        }

        res.status(200).json(rooms);
    } catch (err) {
        console.error("[GET ALL ROOMS BY HOUSE ERROR]", err);
        res.status(500).json({ message: "Lỗi máy chủ." });
    }
};