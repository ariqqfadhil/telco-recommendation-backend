const Boom = require('@hapi/boom');
const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const User = require('../models/User');
const mlService = require('../services/mlService');
const { successResponse } = require('../utils/response');

class RecommendationHandler {
  /**
   * GET /api/recommendations - Get personalized recommendations for user
   */
  async getRecommendations(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const { algorithm = 'hybrid', limit = 5 } = request.query;

      const startTime = Date.now();

      // Get user data dengan preferences dan usage history
      const user = await User.findById(userId)
        .select('preferences usageHistory')
        .lean();

      if (!user) {
        throw Boom.notFound('User not found');
      }

      // Call ML service untuk mendapatkan recommendations
      const mlRecommendations = await mlService.getRecommendations({
        userId,
        preferences: user.preferences,
        usageHistory: user.usageHistory,
        algorithm,
      });

      // Get all active products
      const allProducts = await Product.find({ isActive: true }).lean();

      // Map ML scores to actual products
      const recommendedProducts = mlRecommendations
        .slice(0, limit)
        .map((rec, index) => {
          // Untuk mock, kita ambil produk secara berurutan
          // Nanti ketika ML model ready, akan map berdasarkan product ID dari ML
          const product = allProducts[index % allProducts.length];
          
          return {
            productId: product._id,
            score: rec.score,
            reason: rec.reason,
            product: product, // Include full product details
          };
        });

      const responseTime = Date.now() - startTime;

      // Save recommendation history
      const recommendation = new Recommendation({
        userId,
        recommendedProducts: recommendedProducts.map(r => ({
          productId: r.productId,
          score: r.score,
          reason: r.reason,
        })),
        algorithm,
        responseTime,
        modelVersion: 'v1.0-mock', // Will be from ML service nanti
      });

      await recommendation.save();

      return h.response(
        successResponse('Recommendations retrieved successfully', {
          recommendations: recommendedProducts,
          metadata: {
            algorithm,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
          },
        })
      ).code(200);
    } catch (error) {
      console.error('Get recommendations error:', error);
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to generate recommendations');
    }
  }

  /**
   * GET /api/recommendations/history - Get user's recommendation history
   */
  async getRecommendationHistory(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const { page = 1, limit = 10 } = request.query;

      const skip = (page - 1) * limit;

      const [recommendations, total] = await Promise.all([
        Recommendation.find({ userId })
          .populate('recommendedProducts.productId')
          .sort({ createdAt: -1 })
          .limit(Number(limit))
          .skip(skip)
          .lean(),
        Recommendation.countDocuments({ userId }),
      ]);

      return h.response(
        successResponse('Recommendation history retrieved successfully', {
          recommendations,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to retrieve recommendation history');
    }
  }

  /**
   * POST /api/recommendations/{id}/interaction - Track user interaction
   */
  async trackInteraction(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const { id: recommendationId } = request.params;
      const { productId, action } = request.payload;

      const recommendation = await Recommendation.findOne({
        _id: recommendationId,
        userId,
      });

      if (!recommendation) {
        throw Boom.notFound('Recommendation not found');
      }

      // Add interaction
      recommendation.interactions.push({
        productId,
        action,
        timestamp: new Date(),
      });

      await recommendation.save();

      // Update product purchase count if action is 'purchased'
      if (action === 'purchased') {
        await Product.findByIdAndUpdate(productId, {
          $inc: { purchaseCount: 1 },
        });
      }

      return h.response(
        successResponse('Interaction tracked successfully')
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to track interaction');
    }
  }

  /**
   * GET /api/recommendations/stats - Get recommendation statistics (Admin only)
   */
  async getStats(request, h) {
    try {
      const stats = await Recommendation.aggregate([
        {
          $group: {
            _id: '$algorithm',
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            avgAccuracy: { $avg: '$accuracy' },
          },
        },
      ]);

      const totalRecommendations = await Recommendation.countDocuments();
      const totalUsers = await Recommendation.distinct('userId');

      return h.response(
        successResponse('Statistics retrieved successfully', {
          totalRecommendations,
          totalUsers: totalUsers.length,
          byAlgorithm: stats,
        })
      ).code(200);
    } catch (error) {
      throw Boom.badImplementation('Failed to retrieve statistics');
    }
  }

  /**
   * POST /api/recommendations/feedback - Submit feedback on recommendation
   */
  async submitFeedback(request, h) {
    try {
      const { userId } = request.auth.credentials;
      const { recommendationId, rating, comment } = request.payload;

      const recommendation = await Recommendation.findOne({
        _id: recommendationId,
        userId,
      });

      if (!recommendation) {
        throw Boom.notFound('Recommendation not found');
      }

      // Store feedback (bisa dibuat model terpisah untuk Feedback)
      recommendation.accuracy = rating / 5; // Convert rating to 0-1 scale
      await recommendation.save();

      return h.response(
        successResponse('Feedback submitted successfully')
      ).code(200);
    } catch (error) {
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to submit feedback');
    }
  }
}

module.exports = new RecommendationHandler();