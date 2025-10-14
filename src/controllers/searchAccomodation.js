const Accommodation = require('../models/BoardingHouse')

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

        const results = await Accommodation.find(query);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Search error", detail: err.message });
    }
};