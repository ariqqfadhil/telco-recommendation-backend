// src/services/mlService.js

const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service - Optimized for Telco Hybrid Recommender API
 * Hugging Face Deployment: https://huuddz-telco-hybrid-api.hf.space
 * 
 * API Response Format (NEW):
 * {
 *   "status": "success",
 *   "primary_offer": "Retention Offer",
 *   "top_offers": ["Retention Offer", "General Offer", "Top-up Promo", ...],
 *   "confidence_score": 0.74,
 *   "message": "Berdasarkan kebutuhan Anda..."
 * }
 */
class MLService {
  constructor() {
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
    this.isModelAvailable = true;
    this.lastHealthCheck = null;
  }

  /**
   * Get recommendations from ML model
   * @param {Object} params - { userId, preferences, usageFeatures, algorithm }
   * @returns {Array} recommendations with natural score distribution
   */
  async getRecommendations(params) {
    try {
      const { userId, preferences, usageFeatures, algorithm } = params;

      console.log('🤖 ML Service: Preparing request...');
      console.log('📊 User ID:', userId);
      console.log('📊 Algorithm:', algorithm);
      console.log('🌐 ML Service URL:', this.mlServiceUrl);

      // Prepare request payload with validated data types
      const requestPayload = this._prepareRequestPayload(usageFeatures, preferences);

      console.log('📤 Sending request to ML model...');
      console.log('📋 Request payload:', JSON.stringify(requestPayload, null, 2));

      // Call ML model API with retry logic
      const response = await this._callMLAPI(requestPayload);

      console.log('✅ ML model responded successfully');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
      
      // Parse response with natural distribution
      const recommendations = this._parseMLResponse(response.data);
      
      console.log('✅ Parsed recommendations:', recommendations.length);
      console.log('📊 Natural score distribution:');
      recommendations.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.targetOffer}: ${r.score.toFixed(3)}`);
      });
      
      this.isModelAvailable = true;
      this.lastHealthCheck = new Date();
      
      return recommendations;

    } catch (error) {
      return this._handleMLError(error, params);
    }
  }

  /**
   * Prepare request payload with proper data types
   * @private
   */
  _prepareRequestPayload(usageFeatures, preferences) {
    const usage = usageFeatures || {};
    const prefs = preferences || {};

    return {
      // Data usage in GB (float)
      avg_data_usage_gb: parseFloat((usage.avgDataUsage || 5000) / 1024),
      
      // Video usage percentage (integer 0-100)
      pct_video_usage: Math.round((usage.pctVideoUsage || 0.3) * 100),
      
      // Call duration in minutes (float)
      avg_call_duration: parseFloat(usage.avgCallDuration || 100),
      
      // SMS frequency (integer)
      sms_freq: parseInt(usage.avgSmsCount || 50),
      
      // Monthly spending (float)
      monthly_spend: parseFloat(usage.avgSpending || 75000),
      
      // Top-up frequency (integer)
      topup_freq: parseInt(usage.topupFreq || 1),
      
      // Travel score (integer 0-100)
      travel_score: Math.round((usage.travelScore || 0.1) * 100),
      
      // Complaint count (integer)
      complaint_count: parseInt(usage.complaintCount || 0),
      
      // Plan type (string - exact match with API enum)
      plan_type: this._normalizePlanType(usage.planType || prefs.budget),
      
      // Device brand (string)
      device_brand: usage.deviceBrand || 'Samsung',
    };
  }

  /**
   * Call ML API with retry logic
   * @private
   */
  async _callMLAPI(payload, retries = 2) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await axios.post(
          this.mlServiceUrl,
          payload,
          {
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );
      } catch (error) {
        if (attempt === retries + 1) throw error;
        
        console.log(`⚠️  Attempt ${attempt} failed, retrying...`);
        await this._sleep(1000 * attempt); // Exponential backoff
      }
    }
  }

  /**
   * Parse ML response with NATURAL DISTRIBUTION
   * Preserves confidence scores from ML model without artificial boosting
   * @private
   */
  _parseMLResponse(responseData) {
    const recommendations = [];

    if (!responseData || responseData.status !== 'success') {
      console.warn('⚠️  Invalid response format');
      return recommendations;
    }

    const message = responseData.message || 'Recommended based on your usage pattern';
    const primaryOffer = responseData.primary_offer;
    const topOffers = responseData.top_offers || [];
    
    // Use raw confidence score (0-1 scale)
    let baseConfidence = responseData.confidence_score || 0.5;
    
    // Normalize if needed (API might return 0-100)
    if (baseConfidence > 1) {
      baseConfidence = baseConfidence / 100;
    }

    console.log(`📊 Base confidence from ML: ${baseConfidence.toFixed(3)}`);
    console.log(`📊 Top offers count: ${topOffers.length}`);

    // Strategy: Natural distribution with minimal decay
    // Top offer gets base confidence, others decay naturally by 3-5% per rank
    
    if (topOffers.length > 0) {
      topOffers.forEach((offer, index) => {
        // Natural decay: 3% per rank (preserves ML distribution)
        const rankDecay = Math.pow(0.97, index); // 0.97^0=1.0, 0.97^1=0.97, 0.97^2=0.94...
        const naturalScore = baseConfidence * rankDecay;
        
        // Floor at 0.35 to maintain recommendation quality
        const finalScore = Math.max(naturalScore, 0.35);
        
        recommendations.push({
          targetOffer: offer,
          score: finalScore,
          reason: index === 0 
            ? `${message} (Top recommendation)` 
            : `Alternative recommendation (Rank ${index + 1})`,
          metadata: {
            type: offer === primaryOffer ? 'primary' : 'alternative',
            rank: index + 1,
            originalConfidence: baseConfidence,
            decayFactor: rankDecay,
            isNaturalDistribution: true,
          }
        });
      });

      // Log natural distribution
      console.log('📊 Natural score distribution applied:');
      recommendations.forEach((r, i) => {
        const decay = ((1 - r.metadata.decayFactor) * 100).toFixed(1);
        console.log(`   ${i + 1}. ${r.targetOffer}: ${r.score.toFixed(3)} (decay: ${decay}%)`);
      });
    }

    // Fallback: if no top_offers, use primary_offer
    if (recommendations.length === 0 && primaryOffer) {
      recommendations.push({
        targetOffer: primaryOffer,
        score: baseConfidence,
        reason: message,
        metadata: {
          type: 'primary',
          rank: 1,
          originalConfidence: baseConfidence,
          isNaturalDistribution: true,
        }
      });
    }

    return recommendations;
  }

  /**
   * Handle ML service errors with intelligent fallback
   * @private
   */
  _handleMLError(error, params) {
    console.error('❌ ML Service error:', error.message);
    
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.data?.detail) {
        console.error('❌ Validation errors:');
        error.response.data.detail.forEach((err, index) => {
          console.error(`   ${index + 1}. Field: ${err.loc?.join('.')} - ${err.msg}`);
          console.error(`      Type: ${err.type}`);
        });
      }
    } else if (error.request) {
      console.error('❌ No response from ML service (timeout or network error)');
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
    
    // Fallback to intelligent mock
    console.log('⚠️  Using intelligent fallback recommendations');
    this.isModelAvailable = false;
    
    return this._generateIntelligentFallback(
      params.preferences,
      params.usageFeatures
    );
  }

  /**
   * Generate intelligent fallback based on user profile
   * @private
   */
  _generateIntelligentFallback(preferences = {}, usageFeatures = {}) {
    const recommendations = [];
    const usageType = preferences.usageType || 'mixed';
    const budget = preferences.budget || 'medium';
    const interests = preferences.interests || [];
    
    // Base confidence for fallback (lower than ML)
    let baseConfidence = 0.60;

    console.log('🧠 Generating intelligent fallback...');
    console.log(`   Usage type: ${usageType}`);
    console.log(`   Budget: ${budget}`);
    console.log(`   Interests: ${interests.join(', ') || 'none'}`);

    // Rule-based recommendations with natural scoring
    const rules = [
      // High data users
      {
        condition: usageType === 'data' || usageFeatures.avgDataUsage > 15000,
        offers: [
          { offer: 'Data Booster', score: 0.72, reason: 'High data usage detected' },
          { offer: 'Streaming Partner Pack', score: 0.68, reason: 'Great for data-intensive activities' },
          { offer: 'General Offer', score: 0.62, reason: 'Balanced data package' },
        ]
      },
      // Voice users
      {
        condition: usageType === 'voice' || usageFeatures.avgCallDuration > 200,
        offers: [
          { offer: 'Voice Bundle', score: 0.75, reason: 'Frequent calls detected' },
          { offer: 'General Offer', score: 0.65, reason: 'Includes voice benefits' },
        ]
      },
      // Streaming enthusiasts
      {
        condition: interests.includes('streaming') || usageFeatures.pctVideoUsage > 0.5,
        offers: [
          { offer: 'Streaming Partner Pack', score: 0.78, reason: 'Perfect for streaming' },
          { offer: 'Data Booster', score: 0.70, reason: 'Support your streaming needs' },
        ]
      },
      // Travelers
      {
        condition: usageFeatures.travelScore > 0.3,
        offers: [
          { offer: 'Roaming Pass', score: 0.73, reason: 'Great for travelers' },
          { offer: 'General Offer', score: 0.63, reason: 'Flexible for travel' },
        ]
      },
      // Budget conscious
      {
        condition: budget === 'low',
        offers: [
          { offer: 'Top-up Promo', score: 0.70, reason: 'Budget-friendly option' },
          { offer: 'General Offer', score: 0.65, reason: 'Best value' },
          { offer: 'Data Booster', score: 0.58, reason: 'Affordable data boost' },
        ]
      },
      // Premium users
      {
        condition: budget === 'high' || usageFeatures.avgSpending > 150000,
        offers: [
          { offer: 'Family Plan Offer', score: 0.76, reason: 'Premium family package' },
          { offer: 'Device Upgrade Offer', score: 0.71, reason: 'Premium device option' },
          { offer: 'Retention Offer', score: 0.67, reason: 'Exclusive loyalty benefit' },
        ]
      },
    ];

    // Apply rules and collect unique offers
    const seenOffers = new Set();
    
    rules.forEach(rule => {
      if (rule.condition) {
        rule.offers.forEach(({ offer, score, reason }) => {
          if (!seenOffers.has(offer)) {
            recommendations.push({
              targetOffer: offer,
              score: score,
              reason: `${reason} (Fallback)`,
              metadata: {
                type: 'fallback',
                rank: recommendations.length + 1,
                isFallback: true,
                rule: rule.condition.toString(),
              }
            });
            seenOffers.add(offer);
          }
        });
      }
    });

    // Default fallback if no rules matched
    if (recommendations.length === 0) {
      console.log('   Using default fallback offers');
      recommendations.push(
        { targetOffer: 'General Offer', score: 0.65, reason: 'Popular choice (Fallback)' },
        { targetOffer: 'Data Booster', score: 0.60, reason: 'Essential data package (Fallback)' },
        { targetOffer: 'Voice Bundle', score: 0.55, reason: 'Useful for calls (Fallback)' },
      );
    }

    // Sort by score and limit to top 8
    recommendations.sort((a, b) => b.score - a.score);
    const finalRecommendations = recommendations.slice(0, 8);

    console.log(`✅ Generated ${finalRecommendations.length} fallback recommendations`);
    
    return finalRecommendations;
  }

  /**
   * Normalize plan type to match ML API enum
   * @private
   */
  _normalizePlanType(planType) {
    if (!planType) return 'Prepaid';
    
    const normalized = planType.toLowerCase();
    
    // Map to exact API enum values
    if (normalized.includes('prepaid') || normalized === 'basic' || 
        normalized === 'standard' || normalized === 'low' || normalized === 'medium') {
      return 'Prepaid';
    } else if (normalized.includes('postpaid') || normalized === 'premium' || 
               normalized === 'high') {
      return 'Postpaid';
    }
    
    return 'Prepaid'; // Default
  }

  /**
   * Sleep utility for retry backoff
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for ML service
   */
  async healthCheck() {
    try {
      const healthUrl = this.mlServiceUrl.replace('/recommend', '');
      
      const response = await axios.get(healthUrl, {
        timeout: 5000,
      });
      
      this.isModelAvailable = true;
      this.lastHealthCheck = new Date();
      
      return {
        status: 'healthy',
        available: true,
        url: this.mlServiceUrl,
        lastCheck: this.lastHealthCheck,
        response: response.data,
      };
    } catch (error) {
      this.isModelAvailable = false;
      
      return {
        status: 'unhealthy',
        available: false,
        url: this.mlServiceUrl,
        lastCheck: this.lastHealthCheck,
        error: error.message,
      };
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      url: this.mlServiceUrl,
      timeout: this.timeout,
      isAvailable: this.isModelAvailable,
      lastHealthCheck: this.lastHealthCheck,
      provider: 'Hugging Face',
      docs: 'https://huuddz-telco-hybrid-api.hf.space/docs',
      responseFormat: {
        status: 'success status indicator',
        primary_offer: 'Main recommendation from hybrid model',
        top_offers: 'Array of top N recommendations (ordered by confidence)',
        confidence_score: 'Model confidence (0-1 scale or 0-100)',
        message: 'Explanation message for user',
      },
      scoreDistribution: 'Natural - preserves ML model confidence with minimal decay'
    };
  }
}

module.exports = new MLService();