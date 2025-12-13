// src/handlers/recommendationHandler.js

const Boom = require('@hapi/boom');
const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const User = require('../models/User');
const mlService = require('../services/mlService');
const { successResponse } = require('../utils/response');

class RecommendationHandler {
  /**
   * GET /api/recommendations - Get personalized recommendations for user
   * FIXED: Deterministic product selection + Fallback untuk hasil < limit
   */
  getRecommendations = async (request, h) => {
    try {
      const { userId } = request.auth.credentials;
      const { algorithm = 'hybrid', limit = 5 } = request.query;

      console.log('🔍 Getting recommendations for user:', userId);
      console.log(`📊 Requested limit: ${limit}`);

      const startTime = Date.now();

      // Get user data
      const user = await User.findById(userId).select('preferences deviceBrand planType').lean();

      if (!user) {
        throw Boom.notFound('User not found');
      }

      console.log('✅ User found');
      console.log('👤 User budget:', user.preferences?.budget || 'not set');

      // Generate usage features directly
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
      console.log('📊 ML scores:', mlRecommendations.map(r => r.score.toFixed(3)));

      // Get all active products (cached for performance)
      const allProducts = await Product.find({ isActive: true }).lean();
      console.log('✅ Total active products:', allProducts.length);

      // FIXED: Map ML recommendations to products DETERMINISTICALLY
      let recommendedProducts = this._mapRecommendationsDeterministic(
        mlRecommendations,
        allProducts,
        limit,
        user // Pass user for budget filtering
      );

      console.log('✅ Mapped to products:', recommendedProducts.length);
      console.log('📊 Mapped scores:', recommendedProducts.map(r => r.score.toFixed(3)));

      // FIXED: Fallback jika hasil < limit
      if (recommendedProducts.length < limit) {
        console.log(`⚠️  Only ${recommendedProducts.length} products matched, need ${limit - recommendedProducts.length} more...`);
        
        recommendedProducts = this._addFallbackProducts(
          recommendedProducts,
          allProducts,
          user,
          limit
        );
        
        console.log('✅ After fallback:', recommendedProducts.length);
        console.log('📊 Final scores:', recommendedProducts.map(r => r.score.toFixed(3)));
      }

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

      // IMPORTANT: Final check dan log
      const scoreDistribution = {
        veryHigh: recommendedProducts.filter(r => r.score >= 0.8).length,
        high: recommendedProducts.filter(r => r.score >= 0.6 && r.score < 0.8).length,
        medium: recommendedProducts.filter(r => r.score >= 0.4 && r.score < 0.6).length,
        low: recommendedProducts.filter(r => r.score < 0.4).length,
      };
      
      console.log('📊 Score distribution:');
      console.log(`   Very High (≥0.8): ${scoreDistribution.veryHigh}`);
      console.log(`   High (0.6-0.8): ${scoreDistribution.high}`);
      console.log(`   Medium (0.4-0.6): ${scoreDistribution.medium}`);
      console.log(`   Low (<0.4): ${scoreDistribution.low}`);

      return h.response(
        successResponse('Recommendations retrieved successfully', {
          recommendations: recommendedProducts,
          metadata: {
            algorithm,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            totalRecommendations: recommendedProducts.length,
            mlRecommendations: mlRecommendations.length,
            fallbackUsed: recommendedProducts.length > mlRecommendations.length,
            fallbackCount: Math.max(0, recommendedProducts.length - mlRecommendations.length),
            scoreDistribution,
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
   * FIXED: Map ML recommendations to products DETERMINISTICALLY
   * Tidak pakai random, tapi pakai sorting
   * + Filter by user budget
   * IMPORTANT: Don't override scores!
   */
  _mapRecommendationsDeterministic(mlRecommendations, allProducts, limit, user) {
    const mappedProducts = [];
    const usedProductIds = new Set();
    const userBudget = user?.preferences?.budget;

    for (const rec of mlRecommendations) {
      // Filter products by targetOffer
      let candidateProducts = allProducts.filter(p => 
        p.targetOffer === rec.targetOffer && !usedProductIds.has(p._id.toString())
      );

      // Fallback to category if no products found
      if (candidateProducts.length === 0 && rec.targetOffer) {
        const categoryMap = {
          'Voice Bundle': 'voice',
          'Data Booster': 'data',
          'Roaming Pass': 'roaming',
          'Streaming Partner Pack': 'streaming',
          'Family Plan Offer': 'combo',
          'Device Upgrade Offer': 'device',
          'Retention Offer': 'combo',
          'Top-up Promo': 'data',
          'General Offer': 'combo',
        };
        
        const category = categoryMap[rec.targetOffer];
        if (category) {
          candidateProducts = allProducts.filter(p => 
            p.category === category && !usedProductIds.has(p._id.toString())
          );
        }
      }

      if (candidateProducts.length === 0) continue;

      // FIXED: Filter by user budget (with relaxed ranges)
      const budgetFiltered = this._filterByBudget(candidateProducts, userBudget);
      
      // If budget filter hasil kosong, fallback ke semua candidates (tapi warning)
      const finalCandidates = budgetFiltered.length > 0 ? budgetFiltered : candidateProducts;
      
      if (budgetFiltered.length === 0 && candidateProducts.length > 0) {
        console.log(`⚠️  No products in budget range for ${rec.targetOffer}, using all candidates`);
      }

      // FIXED: Pilih produk secara DETERMINISTIC
      // Sort by: price ASC (cheaper first for budget-conscious), then popularity DESC
      finalCandidates.sort((a, b) => {
        // Primary sort: price (lower is better - budget friendly)
        if (a.price !== b.price) {
          return a.price - b.price;
        }
        // Secondary sort: popularity (higher is better for same price)
        return b.purchaseCount - a.purchaseCount;
      });

      // Take the FIRST product (cheapest, or most popular if same price)
      const selectedProduct = finalCandidates[0];

      // CRITICAL FIX: PRESERVE ML SCORE - don't use default!
      const mlScore = rec.score; // Use exact score from ML
      
      console.log(`   ML match: ${rec.targetOffer} → ${selectedProduct.name} (score: ${mlScore.toFixed(3)})`);

      mappedProducts.push({
        productId: selectedProduct._id,
        score: mlScore, // PRESERVE ML SCORE!
        reason: rec.reason || 'Recommended based on your usage pattern',
        product: selectedProduct,
        mlRecommendation: rec.targetOffer || 'General Offer'
      });

      usedProductIds.add(selectedProduct._id.toString());

      // Stop jika sudah cukup
      if (mappedProducts.length >= limit) break;
    }

    return mappedProducts;
  }

  /**
   * Filter products by user budget
   * UPDATED: More flexible budget ranges with tolerance
   */
  _filterByBudget(products, budget) {
    if (!budget) return products; // No budget filter

    const priceRanges = {
      'low': { min: 0, max: 100000 },        // Rp 0 - 100k (increased tolerance)
      'medium': { min: 30000, max: 200000 }, // Rp 30k - 200k
      'high': { min: 80000, max: 999999 }    // Rp 80k+
    };

    const range = priceRanges[budget];
    if (!range) return products;

    const filtered = products.filter(p => 
      p.price >= range.min && p.price <= range.max
    );

    console.log(`💰 Budget filter (${budget}): ${products.length} → ${filtered.length} products`);
    
    // If budget filter results in 0 products, return all (with warning)
    if (filtered.length === 0) {
      console.log(`⚠️  Budget filter too strict, returning all candidates`);
      return products;
    }
    
    return filtered;
  }

  /**
   * FIXED: Add fallback products jika hasil ML < limit
   * Fill with products based on user preferences
   */
  _addFallbackProducts(currentProducts, allProducts, user, limit) {
    const usedProductIds = new Set(
      currentProducts.map(p => p.productId.toString())
    );

    const needed = limit - currentProducts.length;
    if (needed <= 0) return currentProducts;

    console.log(`📊 Need ${needed} more products for fallback`);

    // Get fallback products based on user preferences
    const fallbackCandidates = this._getFallbackCandidates(
      allProducts,
      user,
      usedProductIds
    );

    // Sort fallback by: popularity DESC, price ASC
    fallbackCandidates.sort((a, b) => {
      if (b.purchaseCount !== a.purchaseCount) {
        return b.purchaseCount - a.purchaseCount;
      }
      return a.price - b.price;
    });

    // Take needed amount
    const fallbackProducts = fallbackCandidates.slice(0, needed).map(product => ({
      productId: product._id,
      score: 0.5, // Lower score untuk fallback
      reason: this._getFallbackReason(product, user),
      product: product,
      mlRecommendation: product.targetOffer || 'General Offer'
    }));

    console.log(`✅ Added ${fallbackProducts.length} fallback products`);

    return [...currentProducts, ...fallbackProducts];
  }

  /**
   * Get fallback candidates based on user preferences
   */
  _getFallbackCandidates(allProducts, user, usedProductIds) {
    const preferences = user.preferences || {};
    
    // Priority 1: Match user's usage type
    let candidates = allProducts.filter(p => {
      if (usedProductIds.has(p._id.toString())) return false;
      
      const categoryMap = {
        'data': ['data', 'streaming'],
        'voice': ['voice', 'combo'],
        'sms': ['combo'],
        'mixed': ['combo', 'data', 'voice']
      };
      
      const preferredCategories = categoryMap[preferences.usageType] || ['combo'];
      return preferredCategories.includes(p.category);
    });

    // Priority 2: Match budget
    if (preferences.budget && candidates.length > 3) {
      const priceRanges = {
        'low': { min: 0, max: 100000 },
        'medium': { min: 50000, max: 200000 },
        'high': { min: 100000, max: 999999 }
      };
      
      const range = priceRanges[preferences.budget];
      if (range) {
        const inBudget = candidates.filter(p => 
          p.price >= range.min && p.price <= range.max
        );
        
        if (inBudget.length > 0) {
          candidates = inBudget;
        }
      }
    }

    // Priority 3: If still empty, use popular products
    if (candidates.length === 0) {
      candidates = allProducts.filter(p => 
        !usedProductIds.has(p._id.toString())
      );
    }

    return candidates;
  }

  /**
   * Generate reason for fallback products
   */
  _getFallbackReason(product, user) {
    const preferences = user.preferences || {};
    
    if (product.category === 'data' && preferences.usageType === 'data') {
      return 'Popular data package for data users like you';
    }
    
    if (product.category === 'voice' && preferences.usageType === 'voice') {
      return 'Popular voice package for frequent callers';
    }
    
    if (product.category === 'streaming' && preferences.interests?.includes('streaming')) {
      return 'Great for streaming enthusiasts';
    }
    
    if (product.category === 'combo') {
      return 'Popular combo package for balanced usage';
    }
    
    if (preferences.budget === 'low' && product.price < 100000) {
      return 'Budget-friendly option within your range';
    }
    
    if (preferences.budget === 'high' && product.price > 100000) {
      return 'Premium package with generous quotas';
    }
    
    return 'Popular choice among users';
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