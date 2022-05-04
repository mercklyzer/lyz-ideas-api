const Product = require('../models/product.model')
const moment = require('moment-timezone')
const productsController = {

  addProduct: async (req, res) => {
    // add some validation
    console.log(req.body);
    const newProduct = new Product({
      ...req.body,
      sold: 0
    });

    try {
      const savedProduct = await newProduct.save(); //inserts the document to the collection
      res.status(200).json(savedProduct);
    } catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  editProduct: async (req, res) => {
    //  add some validation
    try {
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          $set:
          {
            ...req.body
          }
        },
        { new: true }
      );
      res.status(200).json(updatedProduct);
    }
    catch (err) {
      res.status(500).json(err);
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.status(200).json("Product has been deleted...");
    }
    catch (err) {
      res.status(500).json(err);
    }
  },

  getProduct: async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      // remove cost field when user is not admin
      res.status(200).json(product);
    } catch (err) {
      res.status(500).json(err);
    }
  },

  getAllProducts: async (req, res) => {
    const queryNew = req.query.new;
    const queryCategory = req.query.category;

    let queryField = req.query.field === 'lastModified' ? 'updatedAt' : req.query.field
    queryField = queryField === 'product' ? 'title' : queryField
    const querySort = req.query.sort

    try {
      let products;

      if (queryNew) {
        products = await Product.find().sort({ createdAt: -1 }).limit(6);
      }
      else if (queryField) {
        products = await Product.find().sort({ [queryField]: querySort === 'desc' ? -1 : 1 });
      }
      else if (queryCategory) {
        products = await Product.where("category").equals(queryCategory);
      }
      else {
        products = await Product.find();
      }

      products = products.map(product => {
        let { _id, title, category, price, stock, sold, displayImg, previewImg, otherImgs, updatedAt, ...otherData } = product
        return { _id, title, category, price, stock, sold, displayImg, previewImg, otherImgs, updatedAt }
      })

      res.status(200).json(products);
    }
    catch (err) {
      console.log(err);
      res.status(500).json(err);
    }
  },

  getNetSalesStats: async (req, res) => {
    const removeElement = (array, field, value) => {
      const index = array.findIndex(x => x[field] === value);
      if (index > -1) {
        array.splice(index, 1)
      }
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const date = new Date()

    let initialData = []
    let startDate = new Date(date.setFullYear(date.getFullYear() - 1, date.getMonth() + 1, 1))
    let endDate = new Date()

    let traverseDate = new Date(date.setFullYear(startDate.getFullYear(), startDate.getMonth(), 1))
    while (traverseDate <= endDate) {
      initialData.push(traverseDate)
      traverseDate = new Date(date.setFullYear(traverseDate.getFullYear(), traverseDate.getMonth() + 1, 1))
    }
    initialData = initialData.map(date => ({ month: months[moment(date).month()], year: moment(date).year(), sales: 0 }))

    try {
      let data = await Product.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $project: {
            month: { $month: "$createdAt" },
            year: { $year: '$createdAt' },
            income: { $multiply: ["$sold", { $subtract: ["$price", "$cost"] }] }

          }
        },
        {
          $group: {
            _id: ["$month", "$year"],
            sales: { $sum: "$income" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      data = data.map(stat => ({ ...stat, month: months[stat._id[0] - 1], year: stat._id[1] }))
      data = data.map(({ month, year, sales }) => ({ month, year, sales }))
      for (let stat of data) {
        removeElement(initialData, 'month', stat.month)
      }

      data = [...initialData, ...data]
      res.status(200).json(data)
    }
    catch (err) {
      console.log(err);
      res.status(500).json(err)
    }
  },

  getMonthlyNetSales: async (req, res) => {
    const removeElement = (array, field, value) => {
      const index = array.findIndex(x => x[field] === value);
      if (index > -1) {
        array.splice(index, 1)
      }
    }

    const date = new Date()
    const lastMonth = new Date(date.setFullYear(date.getFullYear(), date.getMonth() - 1, 1))
    const now = new Date()

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    let initialData = [lastMonth, now]
    initialData = initialData.map(date => ({ month: months[moment(date).month()], year: moment(date).year(), sales: 0 }))

    try {
      let data = await Product.aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        {
          $project: {
            month: { $month: "$createdAt" },
            year: { $year: '$createdAt' },
            income: { $multiply: ["$sold", { $subtract: ["$price", "$cost"] }] }
          }
        },
        {
          $group: {
            _id: ["$month", "$year"],
            sales: { $sum: "$income" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      data = data.map(stat => ({ ...stat, month: months[stat._id[0] - 1], year: stat._id[1] }))
      data = data.map(({ month, year, sales }) => ({ month, year, sales }))

      for (let stat of data) {
        removeElement(initialData, 'month', stat.month)
      }

      data = [...initialData, ...data]
      data = {
        previous: data[0].sales,
        now: data[1].sales,
        increase: data[1].sales - data[0].sales,
        percentageIncrease: data[0].sales !== 0 ? (data[1].sales - data[0].sales) / data[0].sales : 'Inf'
      }

      res.status(200).json(data)
    }
    catch (err) {
      console.log(err);
      res.status(500).json(err)
    }
  },

  getMonthlyGrossSales: async (req, res) => {
    const removeElement = (array, field, value) => {
      const index = array.findIndex(x => x[field] === value);
      if (index > -1) {
        array.splice(index, 1)
      }
    }

    const date = new Date()
    const lastMonth = new Date(date.setFullYear(date.getFullYear(), date.getMonth() - 1, 1))
    const now = new Date()

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    let initialData = [lastMonth, now]
    initialData = initialData.map(date => ({ month: months[moment(date).month()], year: moment(date).year(), sales: 0 }))

    try {
      let data = await Product.aggregate([
        { $match: { createdAt: { $gte: lastMonth } } },
        {
          $project: {
            month: { $month: "$createdAt" },
            year: { $year: '$createdAt' },
            sales: { $multiply: ["$sold", "$price"] }
          }
        },
        {
          $group: {
            _id: ["$month", "$year"],
            sales: { $sum: "$sales" }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])

      data = data.map(stat => ({ ...stat, month: months[stat._id[0] - 1], year: stat._id[1] }))
      data = data.map(({ month, year, sales }) => ({ month, year, sales }))

      for (let stat of data) {
        removeElement(initialData, 'month', stat.month)
      }

      data = [...initialData, ...data]
      data = {
        previous: data[0].sales,
        now: data[1].sales,
        increase: data[1].sales - data[0].sales,
        percentageIncrease: data[0].sales !== 0 ? (data[1].sales - data[0].sales) / data[0].sales : 'Inf'
      }

      res.status(200).json(data)
    }
    catch (err) {
      console.log(err);
      res.status(500).json(err)
    }
  },
}

module.exports = productsController 