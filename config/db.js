const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '../blip.db');

// Open database (sync & stable on Render)
const db = new Database(DB_PATH, { verbose: console.log });

// Enable foreign keys
db.prepare('PRAGMA foreign_keys = ON').run();

// USERS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT,
    verified BOOLEAN DEFAULT 0,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// PRODUCTS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS products (
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
  )
`).run();

// CARTS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`).run();

// CART ITEMS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK(quantity > 0),
    selected_dates TEXT,
    daily_price REAL CHECK(daily_price >= 0),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  )
`).run();

// OTPS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email_or_phone TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// ORDERS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'cancelled')),
    shipping_address TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'failed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`).run();

// ORDER ITEMS TABLE
db.prepare(`
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    price REAL NOT NULL CHECK(price >= 0),
    selected_dates TEXT,
    daily_price REAL CHECK(daily_price >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  )
`).run();

// CREATE DEFAULT ADMIN
const adminExists = db
  .prepare("SELECT 1 FROM users WHERE is_admin = 1")
  .get();

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  db.prepare(`
    INSERT INTO users (email, password, verified, is_admin)
    VALUES (?, ?, 1, 1)
  `).run('admin@blip.com', hashedPassword);

  console.log('Default admin created → admin@blip.com / admin123');
}

// INSERT SAMPLE PRODUCTS
const productCount = db
  .prepare("SELECT COUNT(*) AS count FROM products")
  .get();

if (productCount.count === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (
      name, description, price, category,
      gender_category, color, size, stock
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleProducts = [
    ["Formal Shirt", "Premium cotton formal shirt", 1299, "formal", "men", "blue", "M", 50],
    ["Casual T-Shirt", "Comfortable everyday t-shirt", 599, "casual", "men", "black", "L", 100],
    ["Ethnic Kurta", "Traditional Indian kurta", 1999, "ethnic", "men", "white", "XL", 30],
    ["Women's Formal Blouse", "Elegant formal blouse", 899, "formal", "women", "pink", "S", 60],
    ["Casual Top", "Trendy casual top", 499, "casual", "women", "red", "M", 80],
    ["Saree", "Traditional Indian saree", 2499, "ethnic", "women", "green", null, 20]
  ];

  const insertMany = db.transaction((products) => {
    for (const p of products) insertProduct.run(...p);
  });

  insertMany(sampleProducts);
  console.log('Sample products inserted');
}

module.exports = db;
