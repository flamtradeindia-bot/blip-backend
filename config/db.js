const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

const DB_PATH = path.join(__dirname, '../blip.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

async function initializeDatabase() {
  db.serialize(() => {
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      phone TEXT UNIQUE,
      password TEXT,
      verified BOOLEAN DEFAULT 0,
      is_admin BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK(price >= 0),
      category TEXT CHECK(category IN ('formal', 'casual', 'ethnic')),
      gender_category TEXT CHECK(gender_category IN ('men', 'women', 'unisex')),
      color TEXT,
      size TEXT,
      image_url TEXT,
      stock INTEGER DEFAULT 0 CHECK(stock >= 0),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Carts table
    db.run(`CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Cart items table
    db.run(`CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1 CHECK(quantity > 0),
      selected_dates TEXT,
      daily_price REAL CHECK(daily_price >= 0),
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )`);

    // OTP table
    db.run(`CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_or_phone TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL CHECK(total_amount >= 0),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
      shipping_address TEXT,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity > 0),
      price REAL NOT NULL CHECK(price >= 0),
      selected_dates TEXT,
      daily_price REAL CHECK(daily_price >= 0),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`);

    // Create default admin user
    db.get("SELECT * FROM users WHERE is_admin = 1", async (err, row) => {
      if (!row) {
        try {
          const adminEmail = 'admin@blip.com';
          const adminPassword = 'admin123';
          const hashedPassword = await bcrypt.hash(adminPassword, 10);
          
          db.run(
            "INSERT INTO users (email, password, verified, is_admin) VALUES (?, ?, 1, 1)",
            [adminEmail, hashedPassword],
            function(err) {
              if (err) {
                console.error("Error creating admin user:", err.message);
              } else {
                console.log("Default admin created - email: admin@blip.com, password: admin123");
              }
            }
          );
        } catch (error) {
          console.error("Error hashing admin password:", error);
        }
      }
    });

    // Insert sample products if none exist
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
      if (err) {
        console.error("Error checking product count:", err.message);
        return;
      }

      if (row.count === 0) {
        const sampleProducts = [
          { 
            name: "Formal Shirt", 
            description: "Premium cotton formal shirt",
            price: 1299,
            category: "formal",
            gender_category: "men",
            color: "blue",
            size: "M",
            stock: 50
          },
          { 
            name: "Casual T-Shirt", 
            description: "Comfortable everyday t-shirt",
            price: 599,
            category: "casual",
            gender_category: "men",
            color: "black",
            size: "L",
            stock: 100
          },
          { 
            name: "Ethnic Kurta", 
            description: "Traditional Indian kurta",
            price: 1999,
            category: "ethnic",
            gender_category: "men",
            color: "white",
            size: "XL",
            stock: 30
          },
          { 
            name: "Women's Formal Blouse", 
            description: "Elegant formal blouse",
            price: 899,
            category: "formal",
            gender_category: "women",
            color: "pink",
            size: "S",
            stock: 60
          },
          { 
            name: "Casual Top", 
            description: "Trendy casual top",
            price: 499,
            category: "casual",
            gender_category: "women",
            color: "red",
            size: "M",
            stock: 80
          },
          { 
            name: "Saree", 
            description: "Traditional Indian saree",
            price: 2499,
            category: "ethnic",
            gender_category: "women",
            color: "green",
            stock: 20
          }
        ];

        sampleProducts.forEach(product => {
          db.run(
            `INSERT INTO products (
              name, description, price, category, gender_category,
              color, size, stock
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.name,
              product.description,
              product.price,
              product.category,
              product.gender_category,
              product.color,
              product.size || null,
              product.stock
            ],
            function(err) {
              if (err) {
                console.error("Error inserting sample product:", err.message);
              }
            }
          );
        });
        console.log("Added sample products to database");
      }
    });
  });
}

module.exports = db;