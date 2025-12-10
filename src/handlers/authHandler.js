const Boom = require('@hapi/boom');
const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

class AuthHandler {
  /**
   * POST /api/auth/request-otp
   * Request OTP for login/register
   */
  async requestOTP(request, h) {
    try {
      const { phoneNumber, name } = request.payload;
      const result = await authService.requestOTP(phoneNumber, name);

      return h.response(
        successResponse(result.message, {
          phoneNumber: result.phoneNumber,
          isNewUser: result.isNewUser,
          expiresIn: result.expiresIn,
          canResendIn: result.canResendIn,
        })
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to send OTP');
    }
  }

  /**
   * POST /api/auth/verify-otp
   * Verify OTP and login
   */
  async verifyOTP(request, h) {
    try {
      const { phoneNumber, otp } = request.payload;
      const result = await authService.verifyOTP(phoneNumber, otp);

      return h.response(
        successResponse('Login successful', result)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('OTP verification failed');
    }
  }

  /**
   * GET /api/auth/otp-config
   * Get OTP configuration (public)
   */
  async getOTPConfig(request, h) {
    try {
      const config = authService.getOTPConfig();

      return h.response(
        successResponse('OTP configuration retrieved', config)
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to get OTP config');
    }
  }

  /**
   * GET /api/auth/profile
   */
  async getProfile(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const user = await authService.getProfile(userId);

      return h.response(
        successResponse('Profile retrieved successfully', user)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to retrieve profile');
    }
  }

  /**
   * PUT /api/auth/profile
   */
  async updateProfile(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const user = await authService.updateProfile(userId, request.payload);

      return h.response(
        successResponse('Profile updated successfully', user)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to update profile');
    }
  }

  /**
   * POST /api/auth/check-phone
   */
  async checkPhoneAvailability(request, h) {
    try {
      const result = await authService.checkPhoneAvailability(
        request.payload.phoneNumber
      );

      return h.response(
        successResponse('Phone number checked', result)
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to check phone availability');
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(request, h) {
    // Dengan JWT, logout biasanya handled di client side
    // Tapi kita bisa log aktivitas logout di server
    return h.response(
      successResponse('Logout successful')
    ).code(200);
  }
}

module.exports = new AuthHandler();