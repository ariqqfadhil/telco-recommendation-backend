const Boom = require('@hapi/boom');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { name, email, password, phoneNumber } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw Boom.conflict('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      role: 'user',
    });

    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Login user
   */
  async login(credentials) {
    const { email, password } = credentials;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw Boom.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw Boom.forbidden('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw Boom.unauthorized('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId).select('-password');
    
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
    const allowedUpdates = ['name', 'phoneNumber', 'preferences'];
    Object.keys(updateData).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = updateData[key];
      }
    });

    await user.save();

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, passwordData) {
    const { oldPassword, newPassword } = passwordData;

    const user = await User.findById(userId);
    if (!user) {
      throw Boom.notFound('User not found');
    }

    // Verify old password
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw Boom.unauthorized('Current password is incorrect');
    }

    // Hash and save new password
    user.password = await hashPassword(newPassword);
    await user.save();

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();