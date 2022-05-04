const verifyUser = (req, res, next) => {
    if(req.user._id.toString() === req.params.id || req.user.isAdmin){
        next()
    }
    else{
        res.status(500).json("User has no authority to do this.");
    }
}

const verifyAdmin = (req, res, next) => {
    if(req.user.isAdmin){
        next()
    }
    else{
        res.status(500).json("User has no authority to do this.");
    }
}

module.exports = {
    verifyUser,
    verifyAdmin
}