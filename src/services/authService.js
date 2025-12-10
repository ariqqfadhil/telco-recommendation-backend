const Boom = require('@hapi/boom');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const otpService = require('./otpService');

class AuthService {
  /**
   * Request OTP - Register or Login
   * Creates user if not exists, sends OTP
   */
  async requestOTP(phoneNumber, name = null) {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Find or create user
    let user = await User.findOne({ phoneNumber: normalizedPhone })
      .select('+otp.lastSentAt');

    const isNewUser = !user;

    if (!user) {
      // Create new user
      user = new User({
        phoneNumber: normalizedPhone,
        name: name || '',
        role: 'user',
        isVerified: false,
      });
    }

    // Check resend cooldown
    if (!otpService.canResendOTP(user.otp?.lastSentAt)) {
      const remaining = otpService.getRemainingCooldown(user.otp.lastSentAt);
      throw Boom.tooManyRequests(
        `Please wait ${remaining} seconds before requesting a new OTP`
      );
    }

    // Generate OTP
    const otpCode = otpService.generateOTP();
    const expiryTime = otpService.getExpiryTime();

    // Save OTP to user
    user.otp = {
      code: otpCode,
      expiresAt: expiryTime,
      attempts: 0,
      lastSentAt: new Date(),
    };

    await user.save();

    // Send OTP via SMS
    const formattedPhone = otpService.formatPhoneNumber(normalizedPhone);
    await otpService.sendOTP(formattedPhone, otpCode);

    return {
      message: isNewUser 
        ? 'Account created. OTP sent to your phone' 
        : 'OTP sent to your phone',
      phoneNumber: normalizedPhone,
      isNewUser,
      expiresIn: otpService.OTP_EXPIRY_MINUTES * 60, // in seconds
      canResendIn: otpService.RESEND_COOLDOWN_SECONDS,
    };
  }

  /**
   * Verify OTP and login
   */
  async verifyOTP(phoneNumber, otpCode) {
    // Validate OTP format
    if (!otpService.isValidOTPFormat(otpCode)) {
      throw Boom.badRequest('Invalid OTP format');
    }

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    // Find user with OTP data
    const user = await User.findOne({ phoneNumber: normalizedPhone })
      .select('+otp.code +otp.expiresAt +otp.attempts');

    if (!user) {
      throw Boom.notFound('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw Boom.forbidden('Your account has been deactivated');
    }

    // Check if OTP exists
    if (!user.otp?.code || !user.otp?.expiresAt) {
      throw Boom.badRequest('No OTP found. Please request a new OTP');
    }

    // Check max attempts
    if (user.otp.attempts >= otpService.MAX_OTP_ATTEMPTS) {
      // Clear OTP and require new request
      user.clearOTP();
      await user.save();
      throw Boom.tooManyRequests(
        'Too many failed attempts. Please request a new OTP'
      );
    }

    // Check if OTP expired
    if (new Date() > user.otp.expiresAt) {
      user.clearOTP();
      await user.save();
      throw Boom.badRequest('OTP has expired. Please request a new OTP');
    }

    // Verify OTP code
    if (!user.isOTPValid(otpCode)) {
      // Increment attempts
      user.incrementOTPAttempts();
      await user.save();
      
      const remainingAttempts = otpService.MAX_OTP_ATTEMPTS - user.otp.attempts;
      throw Boom.unauthorized(
        `Invalid OTP. ${remainingAttempts} attempt(s) remaining`
      );
    }

    // OTP verified successfully
    // Clear OTP
    user.clearOTP();
    user.isVerified = true;
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
        isVerified: user.isVerified,
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
   * Check if phone number is available
   */
  async checkPhoneAvailability(phoneNumber) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const user = await User.findOne({ phoneNumber: normalizedPhone });
    
    return {
      available: !user,
      phoneNumber: normalizedPhone,
      exists: !!user,
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
   * Get OTP configuration
   */
  getOTPConfig() {
    return otpService.getConfig();
  }
}

module.exports = new AuthService();