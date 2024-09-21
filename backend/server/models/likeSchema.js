const mongoose = require('mongoose');
const LikeSchema = mongoose.Schema({
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
  liked_at:{
    type:Date,
    default:Date.now
  }
});

module.exports = mongoose.model('Likes',LikeSchema);