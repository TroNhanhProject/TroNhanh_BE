const contractController = require('../controllers/contractController');
const router = require('express').Router();

// Import admin authentication middleware
const authMiddleware = require('../middleware/authMiddleWare');

// // Cho chủ trọ quản lý mẫu của mình
// router.get('/contract-template', contractController.getOwnerContractTemplate);
// router.post('/contract-template', contractController.createOrUpdateContractTemplate);

// Cho người thuê lấy mẫu hợp đồng của một nhà trọ
router.get('/boarding-houses/:boardingHouseId/contract', contractController.getContractForTenant);

module.exports = router;