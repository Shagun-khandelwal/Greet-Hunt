const mongoose = require('mongoose');
const GreetSchema = mongoose.Schema({
    festive: {
        type: String,
        required: true
    },
    style:{
        type: String
    },
    colour: {
        type: String
    },
    like_count:{
        type: Number
    },
    liked_by :{
        type: Array
    },
    greet_image: {
        type: String
    }
});

module.exports = mongoose.model('Greets',GreetSchema);