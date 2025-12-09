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
  getRecommendations = async (request, h) => {
    try {
      const { userId } = request.auth.credentials;
      const { algorithm = 'hybrid', limit = 5 } = request.query;

      console.log('🔍 Getting recommendations for user:', userId);

      const startTime = Date.now();

      // Get user data
      const user = await User.findById(userId).select('preferences').lean();

      if (!user) {
        throw Boom.notFound('User not found');
      }

      console.log('✅ User found');

      // Generate usage features directly (no dependency on usageProfileService)
      const usageFeatures = this._generateUsageFeatures(user.preferences);
      console.log('✅ Usage features generated');

      // Call ML service to get recommendations
      console.log('🤖 Calling ML service...');
      const mlRecommendations = await mlService.getRecommendations({
        userId,
        preferences: user.preferences,
        usageFeatures,
        algorithm,
      });

      console.log('✅ ML recommendations received:', mlRecommendations.length);

      // Get all active products
      const allProducts = await Product.find({ isActive: true }).lean();
      console.log('✅ Total active products:', allProducts.length);

      // Map ML recommendations to actual products
      const recommendedProducts = this._mapRecommendationsToProducts(
        mlRecommendations,
        allProducts,
        limit
      );

      console.log('✅ Mapped to products:', recommendedProducts.length);

      const responseTime = Date.now() - startTime;

      // Save recommendation history
      try {
        const recommendation = new Recommendation({
          userId,
          recommendedProducts: recommendedProducts.map(r => ({
            productId: r.productId,
            score: r.score,
            reason: r.reason,
          })),
          algorithm,
          responseTime,
          modelVersion: 'v1.0',
        });

        await recommendation.save();
        console.log('✅ Recommendation saved to history');
      } catch (saveError) {
        console.error('⚠️  Failed to save recommendation history:', saveError.message);
      }

      return h.response(
        successResponse('Recommendations retrieved successfully', {
          recommendations: recommendedProducts,
          metadata: {
            algorithm,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            usedFeatures: {
              avgDataUsage: usageFeatures.avgDataUsage,
              userSegment: usageFeatures.userSegment,
              dataPoints: usageFeatures.dataPoints,
            },
          },
        })
      ).code(200);
    } catch (error) {
      console.error('❌ Get recommendations error:', error);
      console.error('❌ Error stack:', error.stack);
      
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to generate recommendations');
    }
  }

  /**
   * Helper: Generate usage features based on preferences
   */
  _generateUsageFeatures(preferences = {}) {
    const defaults = {
      avgDataUsage: 5000, // 5GB default
      avgCallDuration: 100,
      avgSmsCount: 50,
      avgSpending: 75000,
      pctVideoUsage: 0.3,
      topupFreq: 1,
      complaintCount: 0,
      isHeavyDataUser: false,
      contentType: preferences.usageType || 'mixed',
      roamingFrequency: 'never',
      hasFamilyPlan: false,
      travelScore: 0.1,
      deviceBrand: 'Unknown',
      deviceOS: 'Unknown',
      userSegment: 'balanced_user',
      clusterLabel: null,
      planType: 'standard',
      dataPoints: 0,
      completeness: 0.5,
    };

    // Adjust based on preferences
    if (preferences.usageType === 'data') {
      defaults.avgDataUsage = 15000; // 15GB
      defaults.isHeavyDataUser = true;
      defaults.userSegment = 'heavy_data_user';
    } else if (preferences.usageType === 'voice') {
      defaults.avgCallDuration = 500;
      defaults.userSegment = 'heavy_voice_user';
    }

    if (preferences.budget === 'high') {
      defaults.avgSpending = 150000;
      defaults.planType = 'premium';
    } else if (preferences.budget === 'low') {
      defaults.avgSpending = 50000;
      defaults.planType = 'basic';
    }

    if (preferences.interests?.includes('streaming')) {
      defaults.pctVideoUsage = 0.6;
    }

    return defaults;
  }

  /**
   * Helper: Map ML recommendations to products
   */
  _mapRecommendationsToProducts(mlRecommendations, allProducts, limit) {
    return mlRecommendations
      .slice(0, limit)
      .map((rec, index) => {
        let product;
        
        // Try to find product by ID
        if (rec.product_id) {
          product = allProducts.find(p => p._id.toString() === rec.product_id);
        }
        
        // Try to find by name (case-insensitive, partial match)
        if (!product && rec.product_name) {
          product = allProducts.find(p => 
            p.name.toLowerCase().includes(rec.product_name.toLowerCase()) ||
            rec.product_name.toLowerCase().includes(p.name.toLowerCase())
          );
          
          // If not found by name, try by category
          if (!product) {
            const categoryMap = {
              'voice': 'voice',
              'data': 'data',
              'bundle': 'combo',
              'combo': 'combo',
              'sms': 'sms',
              'streaming': 'streaming',
              'vod': 'vod'
            };
            
            const recCategory = Object.keys(categoryMap).find(key => 
              rec.product_name.toLowerCase().includes(key)
            );
            
            if (recCategory) {
              const products = allProducts.filter(p => 
                p.category === categoryMap[recCategory]
              );
              product = products[Math.floor(Math.random() * products.length)];
            }
          }
        }
        
        // Fallback: use product by index
        if (!product) {
          product = allProducts[index % allProducts.length];
        }
        
        return {
          productId: product._id,
          score: rec.score || 0.5,
          reason: rec.reason || 'Recommended based on your usage pattern',
          product: product,
          mlRecommendation: rec.product_name || rec.product_id || 'N/A'
        };
      });
  }

  /**
   * GET /api/recommendations/history - Get user's recommendation history
   */
  getRecommendationHistory = async (request, h) => {
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
      console.error('Get history error:', error);
      throw Boom.badImplementation('Failed to retrieve recommendation history');
    }
  }

  /**
   * POST /api/recommendations/{id}/interaction - Track user interaction
   */
  trackInteraction = async (request, h) => {
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
      console.error('Track interaction error:', error);
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to track interaction');
    }
  }

  /**
   * GET /api/recommendations/stats - Get recommendation statistics (Admin only)
   */
  getStats = async (request, h) => {
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
      console.error('Get stats error:', error);
      throw Boom.badImplementation('Failed to retrieve statistics');
    }
  }

  /**
   * POST /api/recommendations/feedback - Submit feedback on recommendation
   */
  submitFeedback = async (request, h) => {
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

      // Store feedback
      recommendation.accuracy = rating / 5; // Convert rating to 0-1 scale
      await recommendation.save();

      return h.response(
        successResponse('Feedback submitted successfully')
      ).code(200);
    } catch (error) {
      console.error('Submit feedback error:', error);
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to submit feedback');
    }
  }
}

module.exports = new RecommendationHandler();