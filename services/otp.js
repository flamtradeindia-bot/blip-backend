const db = require('../config/db');
const dayjs = require('dayjs');

class OTPService {
  static async storeOTP(emailOrPhone, otp, expiresAt) {
    return new Promise((resolve, reject) => {
      // Delete any existing OTPs for this email/phone
      db.run(
        'DELETE FROM otps WHERE email_or_phone = ?',
        [emailOrPhone],
        function(err) {
          if (err) return reject(err);
          
          // Insert new OTP
          db.run(
            'INSERT INTO otps (email_or_phone, otp, expires_at) VALUES (?, ?, ?)',
            [emailOrPhone, otp, expiresAt.toISOString()],
            function(err) {
              if (err) return reject(err);
              resolve();
            }
          );
        }
      );
    });
  }

  static async verifyOTP(emailOrPhone, otp) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM otps WHERE email_or_phone = ? AND otp = ?',
        [emailOrPhone, otp],
        (err, row) => {
          if (err) return reject(err);
          
          if (!row) {
            return resolve(false);
          }
          
          // Check if OTP is expired
          const isExpired = dayjs(row.expires_at).isBefore(dayjs());
          
          if (isExpired) {
            // Delete expired OTP
            db.run('DELETE FROM otps WHERE id = ?', [row.id]);
            return resolve(false);
          }
          
          // Delete the OTP after verification (one-time use)
          db.run('DELETE FROM otps WHERE id = ?', [row.id]);
          resolve(true);
        }
      );
    });
  }
}

module.exports = OTPService;