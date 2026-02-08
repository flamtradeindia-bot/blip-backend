const Product = require('../models/Product');

class ProductController {
  static async listProducts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        gender, 
        color,
        minPrice,
        maxPrice,
        sortBy,
        sortOrder = 'ASC'
      } = req.query;

      // Validate sort order
      const validSortOrders = ['ASC', 'DESC'];
      const order = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder : 'ASC';

      // Validate sort by field
      const validSortFields = ['price', 'created_at', 'name'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';

      const products = await Product.findAll({ 
        page, 
        limit, 
        category, 
        gender,
        color,
        minPrice,
        maxPrice,
        sortField,
        order
      });

      res.json({ 
        success: true, 
        data: products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: products.length
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getProductDetails(req, res) {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ success: true, data: product });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ProductController;