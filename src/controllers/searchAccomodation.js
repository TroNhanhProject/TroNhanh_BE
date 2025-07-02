const Accommodation = require('../models/Accommodation')

exports.SearchAccomodationNoUsingAI = async (req, res) => {
    try {
        const { district, street, addressDetail } = req.body;
        const searchConditions = {}
        if (district) searchConditions["location.district"] = district
        if (street) searchConditions["location.street"] = street
        if (addressDetail) searchConditions["location.addressDetail"] = addressDetail
        const result = await Accommodation.find(searchConditions)
        return res.status(201).json(result)
    } catch (err) {
        res.status(500).json({ err: err.message })
    }
}