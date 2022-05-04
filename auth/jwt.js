const jwt = require('jsonwebtoken');


const issueJWT = (user) => {
    const payload = {user};
    const signedToken = jwt.sign(payload, process.env.JWT_SECRET);

    return { token: "Bearer " + signedToken };
}

module.exports = issueJWT;