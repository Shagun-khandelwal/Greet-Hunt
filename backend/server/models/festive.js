const mongoose = require('mongoose');
const festiveSchema = mongoose.Schema({
    festive: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('festives',festiveSchema);