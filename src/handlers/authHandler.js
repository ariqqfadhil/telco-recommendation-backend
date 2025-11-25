const Boom = require('@hapi/boom');
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');

class AuthHandler {
  /**
   * POST /api/auth/register
   */
  async register(request, h) {
    try {
      const result = await authService.register(request.payload);

      return h.response(
        successResponse('User registered successfully', result)
      ).code(201);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Registration failed');
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(request, h) {
    try {
      const result = await authService.login(request.payload);

      return h.response(
        successResponse('Login successful', result)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Login failed');
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
   * POST /api/auth/change-password
   */
  async changePassword(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const result = await authService.changePassword(userId, request.payload);

      return h.response(
        successResponse(result.message)
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to change password');
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