const express = require('express');
const router = express.Router();
const Likes = require("../models/likeSchema");
const Greets = require("../models/greetSchema");

//get All Data of Likes Schema
router.get("/", async (req, res) => {
    const AllLikes = await Likes.find({});
    res.status(200).json({ success: true, count: AllLikes.length, data: AllLikes });
});
//Route to add a Like
router.post("/like", async (req, res) => {
    try {
        const { user_id, greet_id } = req.body;
        const existingLike = await Likes.findOne({ user_id, greet_id });
        if (existingLike) {
            return res.status(400).json({ success: false, message: 'You already liked this post.' });
        }
        //create a new Like
        const newLike = new Likes({ user_id, greet_id });
        const greet = await Greets.findOne({ _id: greet_id });
        greet.like_count += 1;
        await greet.save();
        await newLike.save();

        res.status(200).json({ success: true, message: 'Post Liked Successfully', data: newLike });
    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error Liking Post", error: err })
    }
});

router.delete("/unlike", async (req, res) => {
    try {
        const { user_id, greet_id } = req.body;
        const result = await Likes.findOneAndDelete({ user_id, greet_id });
        if (!result) {
            return res.status(400).json({ success: false, message: "Like not found!" });
        }
        const greet = await Greets.findOne({ _id: greet_id });
        greet.like_count -= 1;
        await greet.save();
        res.status(200).json({ success: true, message: "Unlike Successfully." });

    }
    catch (err) {
        res.status(500).json({ success: false, message: "Error Unliking Post", error: err })
    }
});

//route to get all the likes for a single post 
router.get("/likes/:greet_id", async (req, res) => {
    try {
        const { greet_id } = req.params;
        const greet = await Greets.findOne({_id:greet_id});
        if(!greet){
            return res.status(400).json({success:false,message:"The image with the given id not found"});
        }
        const likes = await Likes.find({ greet_id }).populate("user_id","name email").select("-greet_id -_id -liked_at -__v");
        var email_arr=[];
        likes.forEach(ele => {
            email_arr.push(ele.user_id.email);
        });
        res.status(200).json({ success: true, message: "Likes for a post fetch successfully",total_likes:email_arr.length, liked_by: email_arr });

    }
    catch (err) {
        res.status(500).json({success:false,message:"Error in fetching Likes",error:err});
    }
})
module.exports = router;