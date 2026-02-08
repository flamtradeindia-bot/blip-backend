const express = require('express');
const router = express.Router();
const {
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/admin');

router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;