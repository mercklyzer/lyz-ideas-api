var express = require('express');
var router = express.Router();
const passport = require('passport');
const ordersController = require('../controllers/orders.controller')
const {verifyUser, verifyAdmin} = require('../auth/verifyTokenRole')

router.get("/", passport.authenticate('jwt', {session: false}), verifyAdmin, ordersController.getAllOrders);
router.get("/find/:id", passport.authenticate('jwt', {session: false}), verifyUser, ordersController.getUserOrders); // id here is userId

router.get("/:id", passport.authenticate('jwt', {session: false}), verifyUser, ordersController.getOrderById); // id here is productId
router.post("/", passport.authenticate('jwt', {session: false}), ordersController.addOrder);
router.put("/:id", passport.authenticate('jwt', {session: false}), verifyAdmin, ordersController.editOrder);
router.delete("/:id", passport.authenticate('jwt', {session: false}), verifyAdmin, ordersController.deleteOrder);

module.exports = router;
