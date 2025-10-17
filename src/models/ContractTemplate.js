const mongoose = require('mongoose');

const ContractTemplateSchema = new mongoose.Schema({
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true 
    },
    title: {
        type: String,
        required: true,
        trim: true,
        default: 'Hợp Đồng Thuê Phòng Trọ'
    },
    content: {
        type: String,
        required: true,
        default: 'Nội dung hợp đồng mẫu...' 
    },
    signatureImage: {
        type: String, 
        default: null
    },
}, { timestamps: true });

module.exports = mongoose.model('ContractTemplate', ContractTemplateSchema);