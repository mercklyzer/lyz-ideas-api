const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt
const User = require('../models/user.model')

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}

module.exports = (passport) => {
    passport.use(new JwtStrategy(options, function(jwt_payload, done) {
        User.findOne({_id: jwt_payload.user._id})
        .then(user => {
            if(user){
                return done(null, user);
            }
            else{
                return done(null, null)
            }
        })
        .catch(err => {
            console.log(err);
            return done(err, false)
        })
    }));
}