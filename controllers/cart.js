const db = require('../config/db');
const dayjs = require('dayjs');

class CartController {
  static async getOrCreateCart(userId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM carts WHERE user_id = ?',
        [userId],
        (err, cart) => {
          if (err) return reject(err);
          
          if (cart) {
            resolve(cart);
          } else {
            db.run(
              'INSERT INTO carts (user_id) VALUES (?)',
              [userId],
              function(err) {
                if (err) return reject(err);
                resolve({ id: this.lastID, user_id: userId });
              }
            );
          }
        }
      );
    });
  }

  static async addToCart(req, res) {
    const { productId, selectedDates } = req.body;
    const userId = req.user.id;
    
    if (!productId || !selectedDates || !Array.isArray(selectedDates)) {
      return res.status(400).json({ error: 'Product ID and selected dates array are required' });
    }

    try {
      // Validate minimum cart value (1000)
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      });
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      if (product.price < 1000) {
        return res.status(400).json({ error: 'Minimum product value should be ₹1000' });
      }
      
      // Calculate daily price (1% of product price)
      const dailyPrice = product.price * 0.01;
      
      // Get or create cart for user
      const cart = await CartController.getOrCreateCart(userId);
      
      // Add item to cart
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO cart_items (cart_id, product_id, quantity, selected_dates, daily_price)
           VALUES (?, ?, ?, ?, ?)`,
          [cart.id, productId, 1, JSON.stringify(selectedDates), dailyPrice],
          function(err) {
            if (err) return reject(err);
            resolve();
          }
        );
      });
      
      res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getCart(req, res) {
    const userId = req.user.id;
    
    try {
      const cart = await CartController.getOrCreateCart(userId);
      
      const items = await new Promise((resolve, reject) => {
        db.all(
          `SELECT ci.*, p.name, p.price, p.image_url, p.category, p.gender_category, p.color
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           WHERE ci.cart_id = ?`,
          [cart.id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          }
        );
      });
      
      // Calculate total price with daily charges
      let subtotal = 0;
      let dailyCharges = 0;
      
      const cartItems = items.map(item => {
        const dates = JSON.parse(item.selected_dates);
        const days = dates.length;
        const itemDailyCharge = item.daily_price * days;
        
        const itemTotal = item.price + itemDailyCharge;
        
        subtotal += item.price;
        dailyCharges += itemDailyCharge;
        
        return {
          ...item,
          selected_dates: dates,
          days,
          daily_charge: itemDailyCharge,
          item_total: itemTotal
        };
      });
      
      const total = subtotal + dailyCharges;
      
      res.json({
        success: true,
        data: {
          items: cartItems,
          subtotal,
          daily_charges: dailyCharges,
          total
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async removeFromCart(req, res) {
    const { itemId } = req.params;
    const userId = req.user.id;
    
    if (!itemId) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    try {
      // Verify the item belongs to the user's cart
      const cart = await CartController.getOrCreateCart(userId);
      
      await new Promise((resolve, reject) => {
        db.run(
          `DELETE FROM cart_items 
           WHERE id = ? AND cart_id = ?`,
          [itemId, cart.id],
          function(err) {
            if (err) return reject(err);
            if (this.changes === 0) {
              return reject(new Error('Item not found in your cart'));
            }
            resolve();
          }
        );
      });
      
      res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = CartController;