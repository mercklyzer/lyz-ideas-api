var express = require('express');
var router = express.Router();
const cartsController = require('../controllers/carts.controller')
const passport = require('passport')
const {verifyUser, verifyAdmin} = require('../auth/verifyTokenRole') 

router.get("/", verifyAdmin, cartsController.getAllCarts);
router.get("/find/:id", verifyUser, cartsController.getCart);
router.post('/',passport.authenticate('jwt', {session: false}), cartsController.addCart)
router.put('/:id',passport.authenticate('jwt', {session: false}), verifyUser, cartsController.editCart)
router.delete('/:id',passport.authenticate('jwt', {session: false}), verifyUser, cartsController.deleteCart)

module.exports = router;
