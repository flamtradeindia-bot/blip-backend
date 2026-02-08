const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  findByEmailOrPhone: async (emailOrPhone) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? OR phone = ?',
        [emailOrPhone, emailOrPhone],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  },

  create: async ({ name, email, phone, password }) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
        [name, email, phone, hashedPassword],
        function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  findById: async (id) => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  }
};

module.exports = User;