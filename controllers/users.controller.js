const bcrypt = require('bcryptjs');
const User = require('../models/user.model')
const issueJWT = require('../auth/jwt');
const moment = require('moment-timezone')

const usersController = {
    getUser: (req, res) => {
        console.log("get user");
        User.findById(req.params.id)
        .then((user) => {
            if(user){
                const {password, ...otherData} = user._doc

                res.status(200).json(otherData)
            }
            else{
                res.status(404).json({error: 'User not found.'})
            }
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json(err)
        })
        
    },

    getAllUsers: async (req, res) => {

        const queryNew = req.query.new

        let queryField = req.query.field === 'memberSince' ? 'createdAt' : req.query.field
        queryField = req.query.field === 'user' ? 'firstName' : req.query.field
        queryField = queryField === 'role'? 'isAdmin' : queryField
        const querySort = req.query.sort
        
        try{
            let users

            if(queryNew){
                console.log(queryNew);
                users = await User.find().sort({createdAt: -1}).limit(5)
            }
            else if(queryField){
                users = await User.find().sort({ [queryField]: querySort === 'desc'? -1 : 1 });
            }
            else{
                users = await User.find()
            }

            users = users.map(user => {
                const {password, ...otherData} = user._doc
                return otherData
            })
            res.status(200).json(users)
        }
        catch(err){
            res.status(500).json(err)
        }
    },


    getUserStats: async (req, res) => {
        const removeElement = (array, field, value) => {
            const index  = array.findIndex(x => x[field] === value);
            if(index > -1){
                array.splice(index,1)
            }
        }

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const date = new Date()
        
        let initialData = []
        let startDate = new Date(date.setFullYear(date.getFullYear() - 1, date.getMonth() + 1, 1))
        let endDate = new Date()
        
        let traverseDate = new Date(date.setFullYear(startDate.getFullYear(), startDate.getMonth(), 1))
        while(traverseDate <= endDate){
            initialData.push(traverseDate)
            traverseDate = new Date(date.setFullYear(traverseDate.getFullYear(), traverseDate.getMonth() + 1, 1))
        }
        initialData = initialData.map(date => ({month: months[moment(date).month()], year: moment(date).year(), total: 0}))

        try{
            let data = await User.aggregate([
                {$match : {createdAt: {$gte: startDate}}},
                {$project: {
                    month: {$month: "$createdAt"},
                    year: {$year: '$createdAt'}
                }},
                {
                    $group: {
                        _id: ["$month", "$year"], //id represents the month number
                        total: {$sum: 1} //total represents the number of users created that month
                    }
                },
                {
                    $sort: {_id: 1}
                }
            ])
            
            data = data.map(stat => ({...stat, month : months[stat._id[0] - 1], year: stat._id[1]}))
            data = data.map(({month, year, total}) => ({month, year, total}))
            for(let stat of data){
                removeElement(initialData, 'month', stat.month)
            }

            data = [...initialData, ...data]
            res.status(200).json(data)
        }
        catch(err){
            console.log(err);
            res.status(500).json(err)
        }
    },

    getNewUsersCount: async (req, res) => {
        const removeElement = (array, field, value) => {
            const index  = array.findIndex(x => x[field] === value);
            if(index > -1){
                array.splice(index,1)
            }
        }

        const date = new Date()
        const lastMonth = new Date(date.setFullYear(date.getFullYear(), date.getMonth() - 1, 1))
        const now = new Date()

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        let initialData = [lastMonth, now]
        initialData = initialData.map(date => ({month: months[moment(date).month()], year: moment(date).year(), total: 0}))
        
        try{
            let data = await User.aggregate([
                {$match : {createdAt: {$gte: lastMonth}}},
                {$project: {
                    month: {$month: "$createdAt"},
                    year: {$year: '$createdAt'}
                }},
                {
                    $group: {
                        _id: ["$month", "$year"],
                        total: {$sum: 1}
                    }
                },
                {
                    $sort: {_id: 1}
                }
            ])

            data = data.map(stat => ({...stat, month : months[stat._id[0] - 1], year: stat._id[1]}))
            data = data.map(({month, year, total}) => ({month, year, total}))
            for(let stat of data){
                removeElement(initialData, 'month', stat.month)
            }
            
            data = [...initialData, ...data]
            data = {
                previous: data[0].total, 
                now: data[1].total, 
                increase: data[1].total - data[0].total,
                percentageIncrease: data[0].total !== 0? (data[1].total-data[0].total)/data[0].total : 'Inf'
            }

            res.status(200).json(data)
        }
        catch(err){
            console.log(err);
            res.status(500).json(err)
        }
    },

    addUser: (req, res) => {
        const {firstName, lastName, username, email, password, confirmPassword } = req.body

        if(!firstName || !lastName || !username || !email || !password || !confirmPassword){
            res.status(500).json({error: 'Incomplete fields.'})
        }

        else if(!/^[a-zA-Z0-9]{6,18}$/.test(username)){
            res.status(500).json({error: 'Username should only consist of 6-18 alphanumeric characters.'})
        }

        else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
            res.status(500).json({error: 'Invalid email.'})
        }

        // validate passwords
        else if(!/^([a-zA-Z0-9!@#$%^&*()_+\-=\[\]\\;:'",./?]{8,20})$/.test(password) 
        || !/^([a-zA-Z0-9!@#$%^&*()_+\-=\[\]\\;:'",./?]{8,20})$/.test(confirmPassword)){
            res.status(500).json({error: 'Passwords should be 8-20 alphanumeric or special characters.'})
        }

        // compare passwords
        else if(password !== confirmPassword){
            res.status(500).json({error: 'Passwords do not match.'})
        }

        else{
            new Promise((fulfill, reject) => {
                User.countDocuments({username: username}, (err, count) => {
                    if(count > 0){
                        reject({error: 'Username is already taken.'})
                    }
                    else if(err){
                        reject(err)
                    }
                    else{
                        fulfill()
                    }
                })
            })
            .then(() => {
                return new Promise((fulfill, reject) => {
                    User.countDocuments({email: email}, (err, count) => {
                        if(count > 0){
                            reject({error: 'Email is already taken.'})
                        }
                        else if(err){
                            reject(err)
                        }
                        else{
                            fulfill()
                        }
                    })
                })
            })
            .then(() => {
                const newUser = new User({
                    username,
                    firstName,
                    lastName,
                    email,
                    password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
                })

                return newUser.save()
            })
            .then((newUser) => {
                const {password, ...otherData} = newUser._doc
                const accessToken = issueJWT(otherData)
                res.status(200).json({user: otherData, ...accessToken})
            })
            .catch(err => {
                res.status(500).json(err)
            })
        }
    },

    editUser: async (req, res) => {

        try {
          const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body.password? {...req.body, password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))} : req.body},
            { new: true }
          );
          res.status(200).json(updatedUser);
        }
        catch (err) {
          res.status(500).json(err);
        }
      },

    loginUser: (req, res) => {
        const {username,password } = req.body

        if(!username || !password ){
            res.status(500).json({error: 'Incomplete fields.'})
        }

        else{
            // check if username exists
            User.findOne({username: username})
            .then((user) => {
                if(user){
                    const {password:userPassword, ...otherData} = user._doc
                    if(bcrypt.compareSync(password, user.password)){
                        const accessToken = issueJWT(otherData)
                        res.status(200).json({user: otherData, ...accessToken})
                    }
                    else{
                        res.status(403).json({error: 'Incorrect password.'})
                    }
                }
                else{
                    res.status(403).json({error: 'User does not exist.'})
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({error: 'Error in database.'})
            })
        }
    },

    loginAdmin: (req, res) => {
        const {username,password } = req.body

        if(!username || !password ){
            res.status(500).json({error: 'Incomplete fields.'})
        }

        else{
            // check if username exists
            User.findOne({username: username})
            .then((user) => {
                if(user){
                    if(!user.isAdmin){
                        res.status(403).json({error: 'User is not authorized.'})
                    }
                    else{
                        const {password:userPassword, ...otherData} = user._doc
                        if(bcrypt.compareSync(password, user.password)){
                            const accessToken = issueJWT(otherData)
                            res.status(200).json({user: otherData, ...accessToken})
                        }
                        else{
                            res.status(403).json({error: 'Incorrect password.'})
                        }
                    }

                }
                else{
                    res.status(403).json({error: 'User does not exist.'})
                }
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({error: 'Error in database.'})
            })
        }
    },

    deleteUser: (req, res) => {

        if(!req.user.isAdmin){
            res.status(500).json({error: 'You are not authorized to do this.'})
        }
        else{
            User.findByIdAndDelete(req.params.id)
            .then(() => {
                res.status(200).json({data: 'User has been deleted.'})
            })
            .catch((err) => {
                res.status(500).json(err)
            })
        }
    }
}

module.exports = usersController 