const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Schema = mongoose.Schema;
const UserSchema = mongoose.Schema({
    profile_photo:{
        type:String,
        required:true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile_number: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    totalWishlistItem: {
        type: Number,
        default: 0
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: {
        type: String
    },
    emailVerificationExpires: {
        type: Date
    },
    resetPasswordOTP: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
});

UserSchema.pre('save', async function (next) {
    const user = this;

    // hash the password only and only if
    // password is modified or is new
    if (!user.isModified('password')) return next();

    try {
        // generate a salt and hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    }
    catch (error) {
        if (error) return console.error(error.message);
    }
});

//Method to compare entered password and hash password
UserSchema.methods.comparePassword = async (enteredPassword) => {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Users', UserSchema);