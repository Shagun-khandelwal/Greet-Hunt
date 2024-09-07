const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Users = require('../models/userSchema');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
require("dotenv").config({ path: "../../config.env" });

// Sender Transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    secure: true,
    port: 465,
    auth: {
        user: 'finkojitan02@gmail.com',
        pass: "nicnrctbmhcjcklx"
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
        const existingUser = await Users.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `The email ${req.body.email} already exist! Please try another email for registraiton.`
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
        const user = await Users.findOne({ email });
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
        const user = await Users.findOne({ email });
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
        const user = await Users.findOne({ email });

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

// Resetting password by entering the Otp
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { email, password } = req.body;
    try {
        const user = await Users.findOne({ email });
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
})



module.exports = router;