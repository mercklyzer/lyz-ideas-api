var express = require('express');
const passport = require('passport');
var router = express.Router();
const usersController = require('../controllers/users.controller')
const {verifyUser, verifyAdmin} = require('../auth/verifyTokenRole')


/* GET users listing. */
router.get('/', passport.authenticate('jwt', {session: false}), verifyAdmin, usersController.getAllUsers);
router.get('/find/:id', passport.authenticate('jwt', {session: false}), verifyAdmin, usersController.getUser);
router.get('/stats', passport.authenticate('jwt', {session: false}), verifyAdmin, usersController.getUserStats);
router.get('/new/count', passport.authenticate('jwt', {session: false}), verifyAdmin, usersController.getNewUsersCount);

router.post('/register', usersController.addUser)
router.post('/login', usersController.loginUser)
router.post('/loginAdmin', usersController.loginAdmin)
router.put('/:id', passport.authenticate('jwt', {session:false}), verifyAdmin, usersController.editUser)
router.delete('/:id', passport.authenticate('jwt', {session:false}), verifyUser, usersController.deleteUser)

module.exports = router;
