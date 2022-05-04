const mongoose = require('mongoose')
const moment = require('moment-timezone')

const OrderSchema = new mongoose.Schema(
    {
        user: {type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true},
        products: [{
            product: {type: mongoose.SchemaTypes.ObjectId, ref: 'Product', required: true, _id: false}, 
            quantity: {type: Number, required: true}, 
            price: {type: Number, required: true},
            total: {type: Number, required: true}
        }],
        quantity: {type: Number, required: true},
        total: {type: Number, required: true},
        address: {type: String, required: true},
        status: {type: String, enum: ['Pending', 'Completed']},
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Order", OrderSchema)