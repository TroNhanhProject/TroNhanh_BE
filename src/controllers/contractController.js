// file: src/controllers/contractController.js

// ✅ IMPORT THIẾU ĐÃ ĐƯỢC THÊM VÀO
const fs = require('fs');
const path = require('path');

const ContractTemplate = require('../models/ContractTemplate');
const BoardingHouse = require('../models/BoardingHouse');

// Chủ trọ lấy mẫu hợp đồng của mình
exports.getOwnerContractTemplate = async (req, res) => {
    try {
        const template = await ContractTemplate.findOne({ ownerId: req.user.id });
        if (!template) {
            return res.status(404).json({ message: 'Chưa có mẫu hợp đồng nào được tạo.' });
        }
        res.status(200).json(template);
    } catch (error) {
        console.error("[GET OWNER CONTRACT ERROR]", error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Chủ trọ tạo hoặc cập nhật mẫu hợp đồng
exports.createOrUpdateContractTemplate = async (req, res) => {
    try {
        const { title, content, signatureDataUrl } = req.body;
        const ownerId = req.user.id;

        const oldTemplate = await ContractTemplate.findOne({ ownerId });
        const oldSignaturePath = oldTemplate?.signatureImage;

        const updateData = { ownerId, title, content };

        if (signatureDataUrl) {
            const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
            const filename = `signature-${ownerId}-${Date.now()}.png`;
            
            // ✅ BƯỚC BỀN VỮNG
            // 1. Định nghĩa đường dẫn đến thư mục
            const dirPath = path.join(process.cwd(), 'uploads', 'signatures');
            const filePath = path.join(dirPath, filename);

            // 2. Tự động tạo thư mục nếu nó chưa tồn tại
            await fs.promises.mkdir(dirPath, { recursive: true });

            // 3. Ghi file
            await fs.promises.writeFile(filePath, base64Data, 'base64');
            updateData.signatureImage = `/uploads/signatures/${filename}`;
        }

        const template = await ContractTemplate.findOneAndUpdate(
            { ownerId },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        
        if (oldSignaturePath && signatureDataUrl) {
            const oldFilePath = path.join(process.cwd(), oldSignaturePath);
            try {
                await fs.promises.unlink(oldFilePath);
                console.log(`Đã xóa chữ ký cũ thành công: ${oldFilePath}`);
            } catch (unlinkError) {
                console.warn(`Không tìm thấy file chữ ký cũ để xóa: ${oldFilePath}`);
            }
        }
        
        res.status(201).json({ message: 'Đã cập nhật mẫu hợp đồng thành công.', data: template });
    } catch (error) {
        console.error("[CONTRACT UPDATE ERROR]", error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

// Người thuê lấy mẫu hợp đồng để xem
exports.getContractForTenant = async (req, res) => {
    try {
        const { boardingHouseId } = req.params;
        const boardingHouse = await BoardingHouse.findById(boardingHouseId).populate('ownerId');
        if (!boardingHouse) {
            return res.status(404).json({ message: 'Không tìm thấy nhà trọ.' });
        }

        const template = await ContractTemplate.findOne({ ownerId: boardingHouse.ownerId._id });
        if (!template) {
            return res.status(404).json({ message: 'Chủ nhà chưa tạo mẫu hợp đồng.' });
        }
        res.status(200).json(template);
    } catch (error) {
        console.error("[GET TENANT CONTRACT ERROR]", error);
        res.status(500).json({ message: 'Lỗi server.' });
    }
};

