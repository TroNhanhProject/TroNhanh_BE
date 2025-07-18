const Report = require('../models/Report')
const User = require('../models/User')
exports.createReport = async(req,res)=>{
    try{
        const report = new Report(req.body);
        await report.save();
        res.status(201).json(report);
    }catch(error){
        console.error(error);
        res.status(500).json({message:"Failed to create report"})
    }
}

exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: 'owner' }).select('_id name role avatar');
    res.status(200).json(owners);
  } catch (error) {
    console.error("Failed to fetch owners:", error);
    res.status(500).json({ message: "Failed to fetch owners" });
  }
};