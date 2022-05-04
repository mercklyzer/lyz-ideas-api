const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, unique: true },
        desc: { type: String, required: true },
        category: {type: String, enum: ['pillows', 'sofas', 'beds', 'chairs', 'tables'], required: true},
        price: {type: Number, required: true},
        stock: {type: Number, required: true},
        cost: {type: Number, required: true},
        sold: {type: Number, required: true},
        displayImg: {type: String, required: true },
        previewImg: {type: String, required: true },
        otherImgs: [{type: String}]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model("Product", ProductSchema)