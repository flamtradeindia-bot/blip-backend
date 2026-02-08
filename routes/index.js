const express = require('express');
const router = express.Router();

// Import route files
const authRouter = require('./auth');
const productsRouter = require('./products');
const cartRouter = require('./cart');
const adminRouter = require('./admin');

// Import middlewares
const { authenticate } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/admin');

// Public routes
router.use('/auth', authRouter);
router.use('/products', productsRouter);

// Authenticated routes
router.use('/cart', authenticate, cartRouter);

// Admin routes (requires both authentication and admin privileges)
router.use('/admin', authenticate, isAdmin, adminRouter);

module.exports = router;