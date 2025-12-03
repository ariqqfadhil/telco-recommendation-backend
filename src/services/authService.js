const Boom = require('@hapi/boom');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

class AuthService {
  /**
   * Register new user dengan phone number + PIN
   */
  async register(userData) {
    const { phoneNumber, pin, name } = userData;

    // Normalize phone number (remove spaces, convert +62 to 0)
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber: normalizedPhone });
    if (existingUser) {
      throw Boom.conflict('Phone number already registered');
    }

    // Hash PIN
    const hashedPin = await hashPassword(pin);

    // Create new user
    const user = new User({
      phoneNumber: normalizedPhone,
      pin: hashedPin,
      name: name || '',
      role: 'user',
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        isNewUser: user.isNewUser(),
      },
      token,
    };
  }

  /**
   * Login user dengan phone number + PIN
   */
  async login(credentials) {
    const { phoneNumber, pin } = credentials;

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Find user
    const user = await User.findOne({ phoneNumber: normalizedPhone });
    if (!user) {
      throw Boom.unauthorized('Invalid phone number or PIN');
    }

    // Check if user is active
    if (!user.isActive) {
      throw Boom.forbidden('Your account has been deactivated');
    }

    // Verify PIN
    const isPinValid = await comparePassword(pin, user.pin);
    if (!isPinValid) {
      throw Boom.unauthorized('Invalid phone number or PIN');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        role: user.role,
        isNewUser: user.isNewUser(),
      },
      token,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select('-pin');
    
    if (!user) {
      throw Boom.notFound('User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw Boom.notFound('User not found');
    }

    // Update allowed fields
    const allowedUpdates = ['name', 'preferences', 'profilePicture'];
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = updateData[key];
      }
    });

    await user.save();

    return user;
  }

  /**
   * Change PIN
   */
  async changePin(userId, pinData) {
    const { oldPin, newPin } = pinData;

    const user = await User.findById(userId);
    if (!user) {
      throw Boom.notFound('User not found');
    }

    // Verify old PIN
    const isPinValid = await comparePassword(oldPin, user.pin);
    if (!isPinValid) {
      throw Boom.unauthorized('Current PIN is incorrect');
    }

    // Hash and save new PIN
    user.pin = await hashPassword(newPin);
    await user.save();

    return { message: 'PIN changed successfully' };
  }

  /**
   * Check if phone number is available
   */
  async checkPhoneAvailability(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const user = await User.findOne({ phoneNumber: normalizedPhone });
    
    return {
      available: !user,
      phoneNumber: normalizedPhone,
    };
  }

  /**
   * Normalize phone number format
   * Converts various formats to: 08xxxxxxxxxx
   */
  normalizePhoneNumber(phoneNumber) {
    // Remove all spaces and dashes
    let normalized = phoneNumber.replace(/[\s-]/g, '');
    
    // Convert +62 or 62 to 0
    if (normalized.startsWith('+62')) {
      normalized = '0' + normalized.substring(3);
    } else if (normalized.startsWith('62')) {
      normalized = '0' + normalized.substring(2);
    }
    
    return normalized;
  }
}

module.exports = new AuthService();