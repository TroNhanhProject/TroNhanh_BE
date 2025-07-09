const Report = require('../models/Report')

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