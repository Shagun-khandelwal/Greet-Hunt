const express = require('express');
const router = express.Router();
const Wishlist = require("../models/wishlistSchema");
const Greets = require("../models/greetSchema");
const Users = require('../models/userSchema');

//route to get all the wishlist for all users
router.get("/", async (req, res) => {
    const wishlist = await Wishlist.find({});
    res.status(200).json({ success: true, count: wishlist.length, data: wishlist });
});

//route to get all the item present in a user's wishlist
router.get('/userwishlist/:user_id',async (req,res)=>{
    const {user_id} = req.params;
    const user = await Users.findOne({_id:user_id});
    if(!user){
        return res.status(400).json({success:false,message:"user not found!"});
    }
    var wishlist_arr = [];
    const wishlist = await Wishlist.find({user_id}).select("-__v -added_at -user_id -_id");
    wishlist.forEach(ele=>{
        wishlist_arr.push(ele.greet_id);
    })
    return res.status(200).json({success:true,count:wishlist.length,wishlist:wishlist_arr});
})

//route to add an item to the wishlist of a user
router.post('/add', async (req, res) => {
    try {
        const { user_id, greet_id } = req.body;
        const user = await Users.findOne({ _id: user_id });
        const greet = await Greets.findOne({ _id: greet_id });

        if(!user){
            return res.status(400).json({success:false,message:"User not found!"});
        }
        if(!greet){
            return res.status(400).json({success:false,message:"Greet Image not found!"});
        }
        //checking item already present in the wishlist
        const existingWishlistItem = await Wishlist.findOne({ user_id, greet_id });

        if (existingWishlistItem) {
            return res.status(400).json({ success: false, message: "item already added to wishlist" });
        }

        const newWishlistItem = new Wishlist({ user_id, greet_id });
        await newWishlistItem.save();
        user.totalWishlistItem += 1;
        await user.save();

        return res.status(200).json({success:true,message:"Item added to Wishlist Successfully.",data:newWishlistItem});
    }
    catch (err) {
        return res.status(500).json({success:false,message:"Server Error"});
    }
});

//route to delete an item from the wishlist of a user
router.delete('/deleteItem',async (req,res)=>{
    try {
        const {user_id,greet_id} = req.body;
        const user = await Users.findOne({_id:user_id});
        if(!user){
            return res.status(400).json({success:false,message:"User not found!"});
        }
        const result = await Wishlist.findOneAndDelete({user_id,greet_id});
        if(!result){
            return res.status(400).json({sucess:false,message:"Wishlist item not found!"});
        }
        user.totalWishlistItem-=1;
        await user.save();
        return res.status(200).json({success:true,message:"Item removed from wishlist successfully!"});
    } catch (err) {
        return res.status(500).json({success:false,message:"Server Error",error:err});
    }
});

//route to delete all the items from the user's wishlist
router.delete("/deleteAllItem/:user_id",async (req,res)=>{
    try {
        const {user_id} = req.params;
        const user = await Users.findOne({_id:user_id});
        if(!user){
            return res.status(400).json({success:false,message:"User not found!"});
        }
        const result = await Wishlist.deleteMany({user_id});
        if(!result){
            return res.status(400).json({success:false,message:"Items not found!"});
        }
        user.totalWishlistItem=0;
        await user.save();
        return res.status(200).json({success:true,message:`${result.deletedCount} items removed successfully.`});
    } catch (err) {
        return res.status(500).json({success:false,message:"Server Error",error:err});
    }
})
module.exports = router;