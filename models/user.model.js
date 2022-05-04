const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema(
    {
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        firstName : {type: String, required:true},
        lastName : {type: String, required:true},
        password: {type: String, required: true },
        isAdmin: {type: Boolean, default: false },
        totalSpending: {type: Number, default: 0},
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("User", UserSchema)