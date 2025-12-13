// src\handlers\authHandler.js

const Boom = require('@hapi/boom');
const authService = require('../services/authService');
const { successResponse } = require('../utils/response');

/**
 * Simple Authentication Handler
 * No PIN, No OTP - Just phone number based login
 */
class AuthHandler {
  /**
   * POST /api/auth/login
   * Simple login with phone number (auto-register if new)
   */
  async simpleLogin(request, h) {
    try {
      const { phoneNumber, name } = request.payload;
      
      console.log(`🔐 Login attempt: ${phoneNumber}`);
      
      const result = await authService.simpleLogin(phoneNumber, name);

      const message = result.user.isNewUser 
        ? 'Account created and logged in successfully' 
        : 'Login successful';

      return h.response(
        successResponse(message, result)
      ).code(200);
    } catch (error) {
      console.error('❌ Login error:', error);
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Login failed');
    }
  }

  /**
   * GET /api/auth/profile
   * Get user profile
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
   * Update user profile
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
   * Check if phone number is registered
   */
  async checkPhoneAvailability(request, h) {
    try {
      const result = await authService.checkPhoneAvailability(
        request.payload.phoneNumber
      );

      const message = result.exists 
        ? `Phone number registered as ${result.userName}`
        : 'Phone number available (will auto-register on login)';

      return h.response(
        successResponse(message, result)
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to check phone availability');
    }
  }

  /**
   * POST /api/auth/logout
   * User logout (client-side)
   */
  async logout(request, h) {
    // Dengan JWT, logout biasanya handled di client side
    // Tapi kita bisa log aktivitas logout di server
    const { userId, phoneNumber } = request.auth.credentials;
    
    console.log(`👋 User logout: ${phoneNumber} (${userId})`);
    
    return h.response(
      successResponse('Logout successful', {
        message: 'Token removed from client. Please delete token from local storage.',
      })
    ).code(200);
  }

  /**
   * GET /api/auth/users
   * Get all users (Admin only)
   */
  async getAllUsers(request, h) {
    try {
      const { page = 1, limit = 20 } = request.query;
      
      const result = await authService.getAllUsers(page, limit);

      return h.response(
        successResponse('Users retrieved successfully', result)
      ).code(200);
    } catch (error) {
      console.error('Get users error:', error);
      throw Boom.badImplementation('Failed to retrieve users');
    }
  }

  /**
   * DELETE /api/auth/users/{id}
   * Delete user (Admin only)
   */
  async deleteUser(request, h) {
    try {
      const { id } = request.params;
      const user = await authService.deleteUser(id);

      return h.response(
        successResponse('User deactivated successfully', user)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to delete user');
    }
  }
}

module.exports = new AuthHandler();