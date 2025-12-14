// src/handlers/recommendationHandler.js (OPTIMIZED)

const Boom = require('@hapi/boom');
const Recommendation = require('../models/Recommendation');
const Product = require('../models/Product');
const User = require('../models/User');
const mlService = require('../services/mlService');
const usageProfileService = require('../services/usageProfileService');
const { successResponse } = require('../utils/response');

class RecommendationHandler {
  /**
   * GET /api/recommendations - Get personalized recommendations
   * OPTIMIZED: Natural distribution + Smart fallback + Better product matching
   */
  getRecommendations = async (request, h) => {
    try {
      const { userId } = request.auth.credentials;
      const { algorithm = 'hybrid', limit = 5 } = request.query;

      console.log('🔍 Getting recommendations for user:', userId);
      console.log(`📊 Requested limit: ${limit}`);

      const startTime = Date.now();

      // Get user data
      const user = await User.findById(userId)
        .select('phoneNumber name preferences deviceBrand planType balance dataQuota')
        .lean();

      if (!user) {
        throw Boom.notFound('User not found');
      }

      console.log('✅ User found:', user.phoneNumber);
      console.log('👤 User preferences:', JSON.stringify(user.preferences, null, 2));

      // Get or generate usage features
      const usageFeatures = await this._getUsageFeatures(userId, user);
      console.log('✅ Usage features prepared');

      // Call ML service
      console.log('🤖 Calling ML service...');
      const mlRecommendations = await mlService.getRecommendations({
        userId,
        preferences: user.preferences,
        usageFeatures,
        algorithm,
      });

      console.log('✅ ML recommendations received:', mlRecommendations.length);
      if (mlRecommendations.length > 0) {
        console.log('📊 ML scores (natural distribution):');
        mlRecommendations.forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.targetOffer}: ${r.score.toFixed(3)}`);
        });
      }

      // Get all active products (cached)
      const allProducts = await Product.find({ isActive: true }).lean();
      console.log('✅ Total active products:', allProducts.length);

      // Map ML recommendations to products with SMART matching
      let recommendedProducts = await this._mapRecommendationsToProducts(
        mlRecommendations,
        allProducts,
        user,
        limit
      );

      console.log('✅ Mapped to products:', recommendedProducts.length);

      // Smart fallback if needed
      if (recommendedProducts.length < limit) {
        console.log(`⚠️  Need ${limit - recommendedProducts.length} more products...`);
        
        recommendedProducts = await this._addSmartFallback(
          recommendedProducts,
          allProducts,
          user,
          limit
        );
        
        console.log('✅ After smart fallback:', recommendedProducts.length);
      }

      const responseTime = Date.now() - startTime;

      // Save recommendation history
      await this._saveRecommendationHistory(
        userId,
        recommendedProducts,
        algorithm,
        responseTime,
        mlRecommendations.length
      );

      // Generate metadata
      const metadata = this._generateMetadata(
        recommendedProducts,
        mlRecommendations,
        usageFeatures,
        algorithm,
        responseTime
      );

      return h.response(
        successResponse('Recommendations retrieved successfully', {
          recommendations: recommendedProducts,
          metadata,
        })
      ).code(200);
      
    } catch (error) {
      console.error('❌ Get recommendations error:', error);
      console.error('❌ Stack:', error.stack);
      
      if (Boom.isBoom(error)) {
        throw error;
      }
      throw Boom.badImplementation('Failed to generate recommendations');
    }
  }

  /**
   * Get or generate usage features for user
   * @private
   */
  async _getUsageFeatures(userId, user) {
    try {
      // Try to get from UsageProfile
      const features = await usageProfileService.getMLFeatures(userId);
      console.log('✅ Usage features from profile');
      return features;
    } catch (error) {
      // Fallback: generate from user preferences
      console.log('⚠️  Generating usage features from preferences');
      return this._generateFeaturesFromPreferences(user.preferences, user);
    }
  }

  /**
   * Generate usage features from user preferences
   * @private
   */
  _generateFeaturesFromPreferences(preferences = {}, user = {}) {
    const defaults = {
      avgDataUsage: 5000, // 5GB
      avgCallDuration: 100,
      avgSmsCount: 50,
      avgSpending: 75000,
      pctVideoUsage: 0.3,
      topupFreq: 1,
      complaintCount: 0,
      isHeavyDataUser: false,
      contentType: 'mixed',
      roamingFrequency: 'never',
      hasFamilyPlan: false,
      travelScore: 0.1,
      deviceBrand: user.deviceBrand || 'Unknown',
      deviceOS: 'Unknown',
      userSegment: 'balanced_user',
      clusterLabel: null,
      planType: user.planType || 'Prepaid',
      dataPoints: 0,
      completeness: 0.5,
    };

    // Adjust based on preferences
    if (preferences.usageType === 'data') {
      defaults.avgDataUsage = 15000;
      defaults.isHeavyDataUser = true;
      defaults.userSegment = 'heavy_data_user';
    } else if (preferences.usageType === 'voice') {
      defaults.avgCallDuration = 500;
      defaults.userSegment = 'heavy_voice_user';
    }

    if (preferences.budget === 'high') {
      defaults.avgSpending = 150000;
      defaults.planType = 'Postpaid';
    } else if (preferences.budget === 'low') {
      defaults.avgSpending = 50000;
    }

    if (preferences.interests?.includes('streaming')) {
      defaults.pctVideoUsage = 0.6;
      defaults.contentType = 'video';
    }

    if (preferences.interests?.includes('gaming')) {
      defaults.pctVideoUsage = 0.5;
      defaults.avgDataUsage = 12000;
    }

    return defaults;
  }

  /**
   * Map ML recommendations to actual products with SMART matching
   * @private
   */
  async _mapRecommendationsToProducts(mlRecommendations, allProducts, user, limit) {
    const mappedProducts = [];
    const usedProductIds = new Set();
    const userBudget = user?.preferences?.budget;

    console.log('🎯 Starting smart product mapping...');

    for (const rec of mlRecommendations) {
      // Find products by targetOffer
      let candidateProducts = allProducts.filter(p => 
        p.targetOffer === rec.targetOffer && 
        !usedProductIds.has(p._id.toString())
      );

      console.log(`   Checking ${rec.targetOffer}: ${candidateProducts.length} candidates`);

      // Fallback: category mapping if no exact match
      if (candidateProducts.length === 0) {
        const category = this._mapOfferToCategory(rec.targetOffer);
        if (category) {
          candidateProducts = allProducts.filter(p => 
            p.category === category && 
            !usedProductIds.has(p._id.toString())
          );
          console.log(`   Fallback to category '${category}': ${candidateProducts.length} candidates`);
        }
      }

      if (candidateProducts.length === 0) {
        console.log(`   ⚠️  No products found for ${rec.targetOffer}`);
        continue;
      }

      // Smart filtering by budget (relaxed ranges)
      const budgetFiltered = this._filterByBudget(candidateProducts, userBudget);
      const finalCandidates = budgetFiltered.length > 0 ? budgetFiltered : candidateProducts;

      if (budgetFiltered.length === 0 && candidateProducts.length > 0) {
        console.log(`   ⚠️  No budget match, using all ${candidateProducts.length} candidates`);
      } else {
        console.log(`   ✅ Budget filtered: ${finalCandidates.length} candidates`);
      }

      // Smart selection: balance price and popularity
      const selectedProduct = this._selectBestProduct(finalCandidates, userBudget);

      // PRESERVE ML SCORE (natural distribution)
      const naturalScore = rec.score; // Keep original ML score
      
      console.log(`   ✅ Selected: ${selectedProduct.name} (score: ${naturalScore.toFixed(3)})`);

      mappedProducts.push({
        productId: selectedProduct._id,
        score: naturalScore, // NATURAL SCORE from ML
        reason: rec.reason || 'Recommended based on your usage pattern',
        product: selectedProduct,
        mlRecommendation: rec.targetOffer,
        metadata: {
          mlMetadata: rec.metadata,
          selectionMethod: budgetFiltered.length > 0 ? 'budget_aware' : 'best_match',
        }
      });

      usedProductIds.add(selectedProduct._id.toString());

      // Stop if we have enough
      if (mappedProducts.length >= limit) break;
    }

    return mappedProducts;
  }

  /**
   * Map offer name to product category
   * @private
   */
  _mapOfferToCategory(targetOffer) {
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
    
    return categoryMap[targetOffer] || null;
  }

  /**
   * Filter products by user budget (relaxed ranges)
   * @private
   */
  _filterByBudget(products, budget) {
    if (!budget) return products;

    const priceRanges = {
      'low': { min: 0, max: 100000 },
      'medium': { min: 30000, max: 200000 },
      'high': { min: 80000, max: 999999 }
    };

    const range = priceRanges[budget];
    if (!range) return products;

    return products.filter(p => p.price >= range.min && p.price <= range.max);
  }

  /**
   * Select best product from candidates (balance price & popularity)
   * @private
   */
  _selectBestProduct(candidates, userBudget) {
    // Sort by multiple criteria
    candidates.sort((a, b) => {
      // For budget users: prefer cheaper products
      if (userBudget === 'low') {
        if (a.price !== b.price) return a.price - b.price;
      }
      
      // For premium users: prefer popular premium products
      if (userBudget === 'high') {
        if (b.purchaseCount !== a.purchaseCount) {
          return b.purchaseCount - a.purchaseCount;
        }
      }
      
      // Default: balance price and popularity
      // Lower price gets higher score, but popularity matters too
      const aScore = (1000 - a.price / 1000) + a.purchaseCount;
      const bScore = (1000 - b.price / 1000) + b.purchaseCount;
      return bScore - aScore;
    });

    return candidates[0];
  }

  /**
   * Add smart fallback products
   * @private
   */
  async _addSmartFallback(currentProducts, allProducts, user, limit) {
    const usedProductIds = new Set(
      currentProducts.map(p => p.productId.toString())
    );

    const needed = limit - currentProducts.length;
    if (needed <= 0) return currentProducts;

    console.log(`🔄 Adding ${needed} smart fallback products...`);

    // Get smart candidates based on user profile
    const candidates = this._getSmartFallbackCandidates(
      allProducts,
      user,
      usedProductIds
    );

    // Sort by relevance score
    const scoredCandidates = candidates.map(product => ({
      product,
      relevanceScore: this._calculateRelevanceScore(product, user),
    }));

    scoredCandidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Take top N needed
    const fallbackProducts = scoredCandidates
      .slice(0, needed)
      .map(({ product, relevanceScore }) => ({
        productId: product._id,
        score: Math.min(0.55 + relevanceScore * 0.1, 0.70), // Natural fallback score (0.55-0.70)
        reason: this._generateFallbackReason(product, user),
        product: product,
        mlRecommendation: product.targetOffer || 'General Offer',
        metadata: {
          type: 'smart_fallback',
          relevanceScore: relevanceScore.toFixed(2),
        }
      }));

    console.log(`✅ Added ${fallbackProducts.length} smart fallback products`);

    return [...currentProducts, ...fallbackProducts];
  }

  /**
   * Get smart fallback candidates
   * @private
   */
  _getSmartFallbackCandidates(allProducts, user, usedProductIds) {
    const preferences = user.preferences || {};
    const budget = preferences.budget || 'medium';
    
    // Priority 1: Match usage type
    let candidates = allProducts.filter(p => {
      if (usedProductIds.has(p._id.toString())) return false;
      return this._matchesUserProfile(p, preferences);
    });

    // Priority 2: Budget filter
    const budgetFiltered = this._filterByBudget(candidates, budget);
    if (budgetFiltered.length > 5) {
      candidates = budgetFiltered;
    }

    // Priority 3: Popular products if still empty
    if (candidates.length === 0) {
      candidates = allProducts
        .filter(p => !usedProductIds.has(p._id.toString()))
        .sort((a, b) => b.purchaseCount - a.purchaseCount);
    }

    return candidates;
  }

  /**
   * Check if product matches user profile
   * @private
   */
  _matchesUserProfile(product, preferences) {
    const usageType = preferences.usageType || 'mixed';
    const interests = preferences.interests || [];

    const categoryMatch = {
      'data': ['data', 'streaming', 'combo'],
      'voice': ['voice', 'combo'],
      'sms': ['combo'],
      'mixed': ['combo', 'data', 'voice']
    };

    const preferredCategories = categoryMatch[usageType] || ['combo'];
    
    if (preferredCategories.includes(product.category)) return true;
    if (interests.includes('streaming') && product.category === 'streaming') return true;
    if (interests.includes('gaming') && product.category === 'data') return true;

    return false;
  }

  /**
   * Calculate relevance score for fallback product
   * @private
   */
  _calculateRelevanceScore(product, user) {
    let score = 0;
    const preferences = user.preferences || {};

    // Category match
    if (this._matchesUserProfile(product, preferences)) {
      score += 3;
    }

    // Popularity
    score += Math.min(product.purchaseCount / 100, 2);

    // Budget match
    const budget = preferences.budget || 'medium';
    const budgetMatch = this._filterByBudget([product], budget);
    if (budgetMatch.length > 0) {
      score += 2;
    }

    // Price appeal (cheaper = slightly better for fallback)
    if (product.price < 100000) score += 1;

    return score;
  }

  /**
   * Generate reason for fallback product
   * @private
   */
  _generateFallbackReason(product, user) {
    const preferences = user.preferences || {};
    const category = product.category;
    const usageType = preferences.usageType;
    const budget = preferences.budget;

    if (category === 'data' && usageType === 'data') {
      return 'Popular data package for users like you';
    }
    
    if (category === 'voice' && usageType === 'voice') {
      return 'Recommended for frequent callers';
    }
    
    if (category === 'streaming' && preferences.interests?.includes('streaming')) {
      return 'Great choice for streaming enthusiasts';
    }
    
    if (category === 'combo') {
      return 'Popular all-in-one package';
    }
    
    if (budget === 'low' && product.price < 100000) {
      return 'Budget-friendly option';
    }
    
    if (budget === 'high' && product.price > 100000) {
      return 'Premium package with generous benefits';
    }
    
    return 'Popular choice among similar users';
  }

  /**
   * Save recommendation history
   * @private
   */
  async _saveRecommendationHistory(userId, products, algorithm, responseTime, mlCount) {
    try {
      const recommendation = new Recommendation({
        userId,
        recommendedProducts: products.map(r => ({
          productId: r.productId,
          score: r.score,
          reason: r.reason,
        })),
        algorithm,
        responseTime,
        modelVersion: 'v1.0-optimized',
      });

      await recommendation.save();
      console.log('✅ Recommendation saved to history');
    } catch (error) {
      console.error('⚠️  Failed to save recommendation:', error.message);
    }
  }

  /**
   * Generate metadata for response
   * @private
   */
  _generateMetadata(products, mlRecommendations, usageFeatures, algorithm, responseTime) {
    const scoreDistribution = {
      veryHigh: products.filter(r => r.score >= 0.8).length,
      high: products.filter(r => r.score >= 0.6 && r.score < 0.8).length,
      medium: products.filter(r => r.score >= 0.4 && r.score < 0.6).length,
      low: products.filter(r => r.score < 0.4).length,
    };

    return {
      algorithm,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      totalRecommendations: products.length,
      mlRecommendations: mlRecommendations.length,
      fallbackUsed: products.length > mlRecommendations.length,
      fallbackCount: Math.max(0, products.length - mlRecommendations.length),
      scoreDistribution,
      distribution: 'natural', // Natural distribution from ML
      usedFeatures: {
        avgDataUsage: usageFeatures.avgDataUsage,
        userSegment: usageFeatures.userSegment,
        budget: usageFeatures.planType,
        deviceBrand: usageFeatures.deviceBrand,
      },
    };
  }

  /**
   * GET /api/recommendations/history
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
   * POST /api/recommendations/{id}/interaction
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

      recommendation.interactions.push({
        productId,
        action,
        timestamp: new Date(),
      });

      await recommendation.save();

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
      if (Boom.isBoom(error)) throw error;
      throw Boom.badImplementation('Failed to track interaction');
    }
  }

  /**
   * GET /api/recommendations/stats
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
   * POST /api/recommendations/feedback
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

      recommendation.accuracy = rating / 5;
      await recommendation.save();

      return h.response(
        successResponse('Feedback submitted successfully')
      ).code(200);
    } catch (error) {
      console.error('Submit feedback error:', error);
      if (Boom.isBoom(error)) throw error;
      throw Boom.badImplementation('Failed to submit feedback');
    }
  }
}

module.exports = new RecommendationHandler();