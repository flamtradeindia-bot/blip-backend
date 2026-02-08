const db = require('../config/db');

class Product {
  static async create({
    name,
    description = '',
    price,
    category,
    gender_category,
    color = null,
    size = null,
    image_url = null,
    stock = 0
  }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO products (
          name, description, price, category, gender_category, 
          color, size, image_url, stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, category, gender_category, color, size, image_url, stock],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  static async findAll({
    page = 1,
    limit = 10,
    category,
    gender,
    color,
    minPrice,
    maxPrice,
    sortField = 'created_at',
    order = 'ASC'
  }) {
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (gender) {
      conditions.push('gender_category = ?');
      params.push(gender);
    }

    if (color) {
      conditions.push('color = ?');
      params.push(color);
    }

    if (minPrice) {
      conditions.push('price >= ?');
      params.push(minPrice);
    }

    if (maxPrice) {
      conditions.push('price <= ?');
      params.push(maxPrice);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY ${sortField} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  static async update(id, updates) {
    const validFields = [
      'name', 'description', 'price', 'category', 'gender_category',
      'color', 'size', 'image_url', 'stock'
    ];
    
    const setClauses = [];
    const params = [];
    
    for (const [field, value] of Object.entries(updates)) {
      if (validFields.includes(field)) {
        setClauses.push(`${field} = ?`);
        params.push(value);
      }
    }
    
    if (setClauses.length === 0) {
      throw new Error('No valid fields provided for update');
    }
    
    params.push(id);
    
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) return reject(err);
          if (this.changes === 0) {
            return reject(new Error('Product not found'));
          }
          resolve();
        }
      );
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
        if (err) return reject(err);
        if (this.changes === 0) {
          return reject(new Error('Product not found'));
        }
        resolve();
      });
    });
  }
}

module.exports = Product;