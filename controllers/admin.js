const db = require('../config/db');

exports.addProduct = (req, res) => {
    const { name, description, price, category, gender_category, color, size, image_url, stock } = req.body;

    if (!name || !price || !category || !gender_category) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    db.run(
        `INSERT INTO products (
            name, description, price, category, gender_category, 
            color, size, image_url, stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, category, gender_category, color, size, image_url, stock],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                success: true, 
                productId: this.lastID 
            });
        }
    );
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const validFields = ['name', 'description', 'price', 'category', 'gender_category', 'color', 'size', 'image_url', 'stock'];
    const setClauses = [];
    const params = [];

    for (const [field, value] of Object.entries(updates)) {
        if (validFields.includes(field)) {
            setClauses.push(`${field} = ?`);
            params.push(value);
        }
    }

    if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    params.push(id);

    db.run(
        `UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`,
        params,
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ success: true });
        }
    );
};

exports.deleteProduct = (req, res) => {
    const { id } = req.params;

    db.run(
        'DELETE FROM products WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ success: true });
        }
    );
};