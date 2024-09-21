const mongoose = require('mongoose');
const WishlistSchema =mongoose.Schema({
  user_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Users',
    required:true
  },
  greet_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Greets',
    required:true
  },
  added_at:{
    type:Date,
    default:Date.now
  }
});

module.exports = mongoose.model('Wishlist',WishlistSchema);