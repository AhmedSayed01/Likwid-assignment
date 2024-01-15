const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        min: 3
    },
    email: {
        type: String,
        required: true,
        max: 50,
        unique: true
    },
    password: {
        type: String,
        required: true,
    }, phoneNumber: {
        type: String,
        required: true,
    },
    completedTasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
    }],
    xpBalance: {
        type: Number,
        default: 0
    },
});

userSchema.pre("save", async function (next) {
    if (this.isNew) {
        console.log("Before hashing:", this.password);
        this.password = await bcrypt.hash(this.password, 12);
        console.log("After hashing:", this.password);
    }
    next();
});
module.exports = mongoose.model('User', userSchema);