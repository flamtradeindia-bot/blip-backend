const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cart');

router.post('/', CartController.addToCart);
router.get('/', CartController.getCart);

module.exports = router;