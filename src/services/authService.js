const Boom = require('@hapi/boom');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

/**
 * Simple Authentication Service
 * No PIN, No OTP - Just phone number based login
 * Perfect for demo/capstone project
 */
class AuthService {
  /**
   * Simple Login/Register
   * Auto-register if user doesn't exist
   */
  async simpleLogin(phoneNumber, name = null) {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phoneNumber: normalizedPhone });

    const isNewUser = !user;

    if (!user) {
      // Auto-register new user
      user = new User({
        phoneNumber: normalizedPhone,
        name: name || `User ${normalizedPhone.slice(-4)}`,
        role: 'user',
        isVerified: true, // Auto-verify for simple login
      });
      await user.save();
      console.log(`✅ New user auto-registered: ${normalizedPhone}`);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ User logged in: ${normalizedPhone}`);

    // Generate JWT token
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
        isNewUser,
        preferences: user.preferences,
        profilePicture: user.profilePicture,
        lastLogin: user.lastLogin,
      },
      token,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw Boom.notFound('User not found');
    }

    if (!user.isActive) {
      throw Boom.forbidden('Account is deactivated');
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
    
    console.log(`✅ Profile updated: ${user.phoneNumber}`);
    
    return user;
  }

  /**
   * Check if phone number exists
   */
  async checkPhoneAvailability(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const user = await User.findOne({ phoneNumber: normalizedPhone });
    
    return {
      available: !user,
      phoneNumber: normalizedPhone,
      exists: !!user,
      userName: user?.name || null,
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

  /**
   * Admin: Get all users (for testing)
   */
  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      User.find()
        .select('phoneNumber name role isActive lastLogin createdAt preferences')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      User.countDocuments(),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Delete user
   */
  async deleteUser(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw Boom.notFound('User not found');
    }

    // Soft delete
    user.isActive = false;
    await user.save();
    
    console.log(`✅ User deactivated: ${user.phoneNumber}`);
    
    return user;
  }
}

module.exports = new AuthService();