const express = require("express");
const router = express.Router();
const Festives = require("../models/festive");

//get all festives array
router.get("/",async (req,res)=>{
    let festive_arr=[];
    const festives = await Festives.find({});
    festives.map(ele=>{
        festive_arr.push(ele.festive);
    });
    return res.status(200).json({success:true,count:festive_arr.length,festives:festive_arr});
});

//create new festives
router.post("/", async (req,res)=>{
    const {title} = req.body;
    const festive = new Festives({
        festive:title
    });
    await festive.save();
    return res.status(200).json({
        success:true, message:"New festive created",data:festive
    });
});

module.exports = router;