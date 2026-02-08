const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/products');

router.get('/', ProductController.listProducts);

module.exports = router;