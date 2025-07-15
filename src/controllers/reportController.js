// file TroNhanh_BE/src/controllers/reportController.js

const Report = require('../models/Report');

exports.createReport = async (req, res) => {
    try {
        const { reporterId, reportedUserId, type, content } = req.body;

        if (!reporterId || !type || !content || content.length < 10) {
            return res.status(400).json({ message: "Missing required fields or content too short." });
        }

        const newReport = new Report({
            reporterId,
            reportedUserId: reportedUserId || null,
            type,
            content
        });

        const saved = await newReport.save();

        return res.status(201).json({
            message: "Report created successfully",
            data: saved,
        });
    } catch (error) {
        console.error("❌ Error creating report:", error);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getReportsByUser = async (req, res) => {
    try {
const reporterId = req.user.id;

if (!reporterId) {
    return res.status(400).json({ message: "Missing reporterId" });
}

const reports = await Report.find({ reporterId }).sort({ createAt: -1 });

return res.status(200).json({ reports });

    } catch (err) {
        console.error("❌ Error fetching reports:", err);
        res.status(500).json({ message: "Server error" });
    }
};

