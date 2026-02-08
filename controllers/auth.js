const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTPService = require('../services/otp');
const bcrypt = require('bcryptjs');

const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your actual secret

exports.requestOTP = async (req, res) => {
  const { email_or_phone } = req.body;
  
  if (!email_or_phone) {
    return res.status(400).json({ error: 'Email or phone is required' });
  }

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    
    await OTPService.storeOTP(email_or_phone, otp, expiresAt);
    
    // In production, you would send this via SMS/email
    console.log(`OTP for ${email_or_phone}: ${otp}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully (check console for development)'
    });
  } catch (error) {
    console.error('OTP request error:', error);
    res.status(500).json({ error: 'Failed to process OTP request' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { name, email_or_phone, otp } = req.body;
  
  if (!email_or_phone || !otp) {
    return res.status(400).json({ error: 'Email/phone and OTP are required' });
  }

  try {
    const isValid = await OTPService.verifyOTP(email_or_phone, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    let user = await User.findByEmailOrPhone(email_or_phone);
    let isNewUser = false;
    
    if (!user) {
      if (!name) {
        return res.status(400).json({ error: 'Name is required for new users' });
      }
      
      const userId = await User.create({
        name,
        email: email_or_phone.includes('@') ? email_or_phone : null,
        phone: !email_or_phone.includes('@') ? email_or_phone : null,
        password: email_or_phone // In real app, ask for password
      });
      user = await User.findById(userId);
      isNewUser = true;
    }
    
    // Create token with all required fields
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      }, 
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        isNewUser
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};