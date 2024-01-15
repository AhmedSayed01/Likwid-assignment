const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    xpPoints: {
        type: Number,
        required: true,
    },

});

module.exports = mongoose.model('Task', taskSchema);