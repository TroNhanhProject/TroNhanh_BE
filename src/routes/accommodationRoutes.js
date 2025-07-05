const express = require('express');
const router = express.Router();
const accCtrl = require('../controllers/accomodationController');
const searchAc = require('../controllers/searchAccomodation')
router.post('/', accCtrl.createAccommodation);
router.get('/', accCtrl.getAllAccommodations);
router.get('/searchAccomodation', searchAc.SearchAccomodationNoUsingAI)
router.get('/:id', accCtrl.getAccommodationById);
router.put('/:id', accCtrl.updateAccommodation);
router.delete('/:id', accCtrl.deleteAccommodation);
module.exports = router;
