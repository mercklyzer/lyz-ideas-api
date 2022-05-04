var express = require('express');
var router = express.Router();
const passport = require('passport');
const productsController = require('../controllers/products.controller')
const {verifyUser, verifyAdmin} = require('../auth/verifyTokenRole')

router.get("/", productsController.getAllProducts);
router.get("/find/:id", productsController.getProduct);
router.get("/sales", productsController.getNetSalesStats);
router.get("/sales/net/monthly", productsController.getMonthlyNetSales);
router.get("/sales/gross/monthly", productsController.getMonthlyGrossSales);
router.post("/", passport.authenticate('jwt', {session: false}), verifyAdmin, productsController.addProduct);
router.put("/:id", passport.authenticate('jwt', {session: false}), verifyAdmin, productsController.editProduct);
router.delete("/:id", passport.authenticate('jwt', {session: false}), verifyAdmin, productsController.deleteProduct);

module.exports = router;
