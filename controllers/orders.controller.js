const Order = require('../models/order.model')
const User = require('../models/user.model')
const Product = require('../models/product.model')
const stripe = require('stripe')(process.env.STRIPE_KEY)
const moment = require('moment-timezone')

const ordersController = {

  addOrder: async (req, res) => {
    console.log("add order");
    let totalPrice = 0
    let totalQuantity = 0
    console.log(req.body);

    const fetchProducts = () => {
      const products = req.body.products.map(async product => {
        const fetchedProduct = await Product.findByIdAndUpdate(product.productId, {
          $inc: {
            sold: product.quantity
          }
        })
        const productTotalPrice = fetchedProduct.price * product.quantity
        totalQuantity += product.quantity
        totalPrice += productTotalPrice

        return ({
          product: product.productId,
          quantity: product.quantity,
          price: fetchedProduct.price,
          total: productTotalPrice
        })
      });

      return Promise.all(products)
    }

    const products = await fetchProducts()

    stripe.charges.create({
      source: req.body.tokenId,
      amount: totalPrice,
      currency: 'usd'
    }, async (stripeErr, stripeRes) => {
      if (stripeErr) {
        console.log(stripeErr);
        res.status(500).json(stripeErr)
      }
      else {
        console.log(stripeRes)
        const newOrder = new Order({
          user: req.user._id,
          products: products,
          quantity: totalQuantity,
          total: totalPrice,
          address: stripeRes.source.address_line1,
          status: 'Pending'
        })

        try {
          const savedOrder = await newOrder.save();
          const updatedUser = await User.findByIdAndUpdate(
            req.user._id.toString(),
            {
              $inc: {
                totalSpending: totalPrice
              }
            }
          )
          console.log(updatedUser);
          res.status(200).json(savedOrder);
        } catch (err) {
          console.log(err);
          res.status(500).json(err);
        }
      }
    })
  },

  editOrder: async (req, res) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true }
      );
      res.status(200).json(updatedOrder);
    }
    catch (err) {
      res.status(500).json(err);
    }
  },

  deleteOrder: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json("Product has been deleted...");
    }
    catch (err) {
      res.status(500).json(err);
    }
  },

  getUserOrders: async (req, res) => {
    let queryField = req.query.field === 'orderDate' ? 'createdAt' : req.query.field
    queryField = queryField === 'amount' ? 'total' : queryField
    const querySort = req.query.sort

    try {
      let orders

      if (queryField) {
        orders = await Order.find({ user: req.params.id }).populate("user", "_id firstName lastName").sort({ [queryField]: querySort === 'desc' ? -1 : 1 });
      }
      else {
        orders = await Order.find({ user: req.params.id }).populate("products.product", '_id displayImg title price').sort({ updatedAt: -1 });
      }



      // let orders = await Order.find({ userId: req.params.id }).populate("products.product", '_id displayImg title price').sort({ updatedAt: -1 });
      res.status(200).json(orders);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  // specific to orderId
  getOrderById: async (req, res) => {
    try {
      let order = await Order.findById(req.params.id).populate("user", '_id username firstName lastName').populate("products.product", "_id displayImg title")
      console.log(order);
      res.status(200).json(order);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  getAllOrders: async (req, res) => {
    // add some filter on query (i.e. by status, date)
    const queryNew = req.query.new
    let queryField = req.query.field === 'orderDate' ? 'createdAt' : req.query.field
    queryField = queryField === 'amount' ? 'total' : queryField
    const querySort = req.query.sort

    try {
      let orders

      if (queryNew) {
        orders = await Order.find().populate("user", "_id firstName lastName").sort({ updatedAt: -1 }).limit(5);
      }
      else if (queryField) {
        orders = await Order.find().populate("user", "_id firstName lastName").sort({ [queryField]: querySort === 'desc' ? -1 : 1 });
      }
      else {
        orders = await Order.find().populate("user", "_id firstName lastName");
      }

      res.status(200).json(orders);
    }
    catch (err) {
      res.status(500).json(err);
    }
  }
}

module.exports = ordersController 