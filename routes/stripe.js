var express = require('express');
var router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_KEY)

router.post('/payment', (req, res) => {
    // use passport to get userId
    // move to orders controller
    stripe.charges.create({
        source: req.body.tokenId,
        amount: req.body.amount, // compute from orders
        currency: 'usd'
    }, (stripeErr, stripeRes) => {
        if(stripeErr){
            console.log(stripeErr);
            res.status(500).json(stripeErr)
        }
        else{
            res.status(200).json(stripeRes)
            // get billing Address -> stripeRes.source.address_line1
        }
    })
});

module.exports = router;
