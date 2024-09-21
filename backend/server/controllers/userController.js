const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Users = require('../models/userSchema');
const Wishlist = require("../models/wishlistSchema");
const Greets = require("../models/greetSchema");
const Liked = require('../models/likeSchema');
const authenticatetoken = require('../middlewares/authenticatetoken');
require("dotenv").config({ path: "../../config.env" });
// const jwtsecretkey=process.env.jwtsecretkey;
const {JWTSECRETKEY,EMAIL,PASSWORD} = process.env;
// Sender Transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    port: 465,
    auth: {
        user: EMAIL,
        pass: PASSWORD
    }
});

// Get All Users
router.get('/', async (req, res) => {
    const users = await Users.find();
    if (!users) res.status(404).send("Error in fetching users.");

    res.status(200).json({
        success: true,
        count: users.length,
        data: users
    });

});

//get the user details using email 
router.get('/email/:email',async (req,res)=>{
    const {email} = req.params;
    const user = await Users.find({email});
    if(!user){
        return res.status(400).json({success:false,message:"User not found!"});
    }
    return res.status(200).json({success:true,data:user})
});

//get the user details using phone number
router.get('/phone/:mobile_number',async (req,res)=>{
    const {mobile_number} = req.params;
    const user = await Users.find({mobile_number});
    if(!user){
        return res.status(400).json({success:false,message:"User not found!"});
    }
    return res.status(200).json({success:true,data:user})
});

//proteted route to check for JWT verification
router.get('/protected',authenticatetoken,(req,res)=>{
    res.status(200).json({success:true,message: `Hello user with Id : ${req.user.email}`});
})
//get a user with particular id
router.get("/:id", async (req, res) => {
    let user;
    user = await Users.findById(req.params.id).select("-password");

    if (!user) {
        res.status(404).json({
            success: false,
            message: "User Not Found!"
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: user
    });
});



// Create A user 
router.post('/', async (req, res) => {
    if (!req.body.name || !req.body.email || !req.body.password || !req.body.mobile_number) {
        res.status(400).json({
            success: false,
            message: "Please fill all the fields"
        });
        return;
    }
    try {
        const existingUser = await Users.findOne({ email: {$regex: new RegExp(`${req.body.email}$`,'i')} });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `The email ${existingUser.email} already exist! Please try another email for registraiton.`
            });
        }

        //generate an OTP for email verification
        const Otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const OtpExpires = Date.now() + 600000; //valid of 10 minutes

        const user = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            mobile_number: req.body.mobile_number,
            emailVerificationOTP: Otp,
            emailVerificationExpires: OtpExpires,
            wishlist: []
        });
        await user.save()
            .catch(err => {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            });


        //create Email format
        const mailOptions = {
            from: 'finkojitan02@gmail.com',
            to: req.body.email,
            subject: 'Email Verification OTP',
            html: `
                <p>Hi ${req.body.name},</p>
                <p>Thank you for registering in GreetHunt!</p>
                <p>Your OTP for email verification is:</p><br><br>
                <h1>${Otp}</h1><br><br>
                <p>Please Do Not Share with some one else.</p>`
        };
        //send mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error sending Email',
                    error: error
                });
            }
        });
        res.status(200).json({
            success: true,
            message: 'Registration successful,OTP sent to your email.'
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error
        });
    }
});

// Resent Otp if expired 
router.put('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        //find the user by email
        const user = await Users.findOne({ email:{$regex: new RegExp(`${email}$`,'i')} });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }
        var Otp;
        Otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const OtpExpires = Date.now() + 600000; //valid of 10 minutes
        user.emailVerificationOTP = Otp;
        user.emailVerificationExpires = OtpExpires;
        await user.save();
        const mailOptions = {
            from: 'finkojitan02@gmail.com',
            to: req.body.email,
            subject: 'Email Verification OTP',
            html: `
                <p>Hi ${user.name},</p>
                <p>Thank you for registering in GreetHunt!</p>
                <p>Your OTP for email verification is:</p><br><br>
                <h1>${Otp}</h1><br><br>
                <p>Please Do Not Share with some one else.</p>`
        };
        //send mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error sending Email',
                    error: error
                });
            }
        });
        res.status(200).json({
            success: true,
            message: 'OTP sent to your email.'
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

//Email Verification Route -> Have to enter otp
router.post('/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        //find the user by email
        const user = await Users.findOne({ email:{$regex: new RegExp(`${email}$`,'i')} });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        //Check if OTP is valid and not expired
        if (user.emailVerificationOTP === otp && user.emailVerificationExpires > Date.now()) {
            user.emailVerified = true;
            user.emailVerificationOTP = undefined; //clear OTP
            user.emailVerificationExpires = undefined;
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Email Successfully Verified.'
            })
        }
        else {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP.Please Try Again!"
            })
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await Users.findOne({ email:{$regex: new RegExp(`${email}$`,'i')} });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found!'
            });
        }

        var Otp;
        Otp = crypto.randomBytes(3).toString('hex').toUpperCase();
        const OtpExpires = Date.now() + 600000;

        user.resetPasswordOTP = Otp;
        user.resetPasswordExpires = OtpExpires;
        await user.save();
        const mailOptions = {
            from: 'finkojitan02@gmail.com',
            to: req.body.email,
            subject: `Password Reset OTP`,
            html: `<p>Hi ${user.name},</p>
            <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.<p><br>
            <p>Here's the One time Password for your request:-<p><br><br>
            <h1>${Otp}</h1> <br><br>
            <p>Please Do Not Share with some one else.</p>        
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: 'Error sending email' });
            }
            res.status(200).json({ message: 'Password reset link sent to your email' });
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ message: 'Server error' });
    }

});

// Resetting password After forgetting pwd by entering the Otp
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({ email:{$regex: new RegExp(`${email}$`,'i')} });
        if (!user) {
            res.status(400).json({ success: false, message: 'user with the given email Id not found!' });
        }
        if (token == user.resetPasswordOTP && user.resetPasswordExpires > Date.now()) {
            user.password = password;
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;

            await user.save();

            res.status(200).json({ success: true, message: 'Password has been reset successfully!' })
        }
        else {
            res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' })
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

//login
router.post("/login",async (req,res)=>{
    const {email,password,mobile} = req.body;
    try{
    const user = await Users.findOne({$or:[{email:{$regex: new RegExp(`${email}$`,'i')}},{mobile_number:mobile}]});
        if (!user) {
            return res.status(401).json({success:false, message: 'Invalid email or password' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const token = jwt.sign({ _id: user._id,email:user.email }, JWTSECRETKEY, { expiresIn: '1h' });

        res.status(200).json({ success:true,token, message: 'Login successful' });
    }
    catch(error){
        res.status(500).json({success:false,message:'Internal Server Error',error:error});
    }
});

//LOGOUT
router.post("/logout",async (req,res)=>{
    res.clearCookie('token');
    res.status(200).json({success:true,message:"Logged Out Successfully!"})
});

//delete a user
router.delete("/delete/:user_id",async (req,res)=>{
    const {user_id} = req.params;
    const result = await Users.deleteOne({_id:user_id});
    if(!result){
        return res.status(400).json({success:false,message:"Invalid User"});
    }
    //deleting likes count from greet Images for the current user
    const likes = await Liked.find({ user_id }).select("-_id -liked_at -__v -user_id");
    
    likes.forEach(async ele => {
        var greet = await Greets.findOne({_id:ele.greet_id});
        greet.like_count-=1;
        await greet.save();
    });

    const deleteLikes = await Liked.deleteMany({user_id});
    if(!deleteLikes){
        return res.status(400).json({success:false,message:"Unable to delete Likes"});
    }
    
    const deleteWishlist = await Wishlist.deleteMany({user_id});
    if(!deleteWishlist){
        return res.status(400).json({success:false,message:"Unable to delete Likes"});
    }

    
    return res.status(200).json({success:true,message:"user deletion successful!"});
})



module.exports = router;