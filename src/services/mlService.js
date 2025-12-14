// src/services/mlService.js

const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service - Handles communication with ML model (Hugging Face Deployment)
 * Model URL: https://huuddz-telco-hybrid-api.hf.space/recommend
 * 
 * API Response Format:
 * {
 *   "status": "success",
 *   "recommendation": {
 *     "primary_offer": "Retention Offer",
 *     "social_proof_offer": "General Offer",
 *     "confidence_score": 0.58
 *   },
 *   "message": "Berdasarkan kebutuhan Anda...",
 *   "user_summary": {
 *     "spend": 0,
 *     "device": "string"
 *   }
 * }
 */
class MLService {
  constructor() {
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
    this.isModelAvailable = true;
  }

  /**
   * Get recommendations from ML model
   * @param {Object} params - { userId, preferences, usageFeatures, algorithm }
   */
  async getRecommendations(params) {
    try {
      const { userId, preferences, usageFeatures, algorithm } = params;

      console.log('🤖 ML Service: Preparing request...');
      console.log('📊 User ID:', userId);
      console.log('📊 Algorithm:', algorithm);
      console.log('🌐 ML Service URL:', this.mlServiceUrl);

      // Prepare request payload based on Hugging Face API schema
      const requestPayload = {
        // Data usage in GB (convert from MB)
        avg_data_usage_gb: parseFloat((usageFeatures?.avgDataUsage || 5000) / 1024),
        
        // Video usage percentage (0-100 scale, from schema)
        // Convert from 0-1 to 0-100 and ensure integer
        pct_video_usage: parseInt((usageFeatures?.pctVideoUsage || 0.3) * 100),
        
        // Call duration in minutes
        avg_call_duration: parseFloat(usageFeatures?.avgCallDuration || 100),
        
        // SMS frequency (integer)
        sms_freq: parseInt(usageFeatures?.avgSmsCount || 50),
        
        // Monthly spending
        monthly_spend: parseFloat(usageFeatures?.avgSpending || 75000),
        
        // Top-up frequency (integer)
        topup_freq: parseInt(usageFeatures?.topupFreq || 1),
        
        // Travel score (INTEGER 0-100 scale, from error message)
        // Convert from 0-1 to 0-100 and ensure integer
        travel_score: parseInt((usageFeatures?.travelScore || 0.1) * 100),
        
        // Complaint count (integer)
        complaint_count: parseInt(usageFeatures?.complaintCount || 0),
        
        // Plan type (string: must be exact match with enum)
        plan_type: this._normalizePlanType(usageFeatures?.planType),
        
        // Device brand (string)
        device_brand: usageFeatures?.deviceBrand || 'Samsung',
      };

      console.log('📤 Sending request to ML model...');
      console.log('📋 Request payload:', JSON.stringify(requestPayload, null, 2));

      // Call ML model API
      const response = await axios.post(
        this.mlServiceUrl,
        requestPayload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );

      console.log('✅ ML model responded successfully');
      console.log('📊 Response status:', response.status);
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
      
      // Parse the actual response format from your API
      const recommendations = this._parseMLResponse(response.data);
      
      console.log('📊 Parsed recommendations:', recommendations.length);
      console.log('📊 Offers:', recommendations.map(r => `${r.targetOffer} (${r.score.toFixed(2)})`));
      
      this.isModelAvailable = true;
      return recommendations;

    } catch (error) {
      console.error('❌ ML Service error:', error.message);
      
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', JSON.stringify(error.response.data, null, 2));
        
        // Log detail errors untuk debugging
        if (error.response.data?.detail) {
          console.error('❌ Validation errors:');
          error.response.data.detail.forEach((err, index) => {
            console.error(`   ${index + 1}. Field: ${err.loc?.join('.')} - ${err.msg}`);
            console.error(`      Type: ${err.type}`);
          });
        }
      } else if (error.request) {
        console.error('❌ No response received from ML service');
        console.error('❌ Request timeout or network error');
      } else {
        console.error('❌ Error setting up request:', error.message);
      }
      
      // Fallback to mock data if ML service fails
      console.log('⚠️  ML Service failed, using fallback mock data');
      this.isModelAvailable = false;
      
      return this._generateMockRecommendations(
        params.preferences,
        params.usageFeatures
      );
    }
  }

  /**
   * Parse ML response to extract recommendations
   * Based on actual API response format from Hugging Face
   * 
   * Supports multiple response formats:
   * 1. NEW FORMAT: { primary_offer, top_offers[], confidence_score }
   * 2. OLD FORMAT: { recommendation: { primary_offer, social_proof_offer } }
   * 
   * @private
   */
  _parseMLResponse(responseData) {
    const recommendations = [];

    if (!responseData) {
      console.warn('⚠️  No response data');
      return recommendations;
    }

    const message = responseData.message || 'Recommended based on your usage pattern';
    
    // NEW FORMAT: top_offers array (PRIORITY - check this first!)
    if (responseData.top_offers && Array.isArray(responseData.top_offers)) {
      console.log('✅ Using NEW response format (top_offers array)');
      
      // Confidence score could be 0-1 or 0-100 scale
      let confidenceScore = responseData.confidence_score || 0.5;
      
      // Normalize to 0-1 scale if needed
      if (confidenceScore > 1) {
        confidenceScore = confidenceScore / 100;
      }
      
      // Map each offer in the array
      responseData.top_offers.forEach((offer, index) => {
        // Decay confidence for lower-ranked offers
        const rankDecay = 1 - (index * 0.05); // 5% decay per rank
        const adjustedScore = Math.max(confidenceScore * rankDecay, 0.3);
        
        recommendations.push({
          targetOffer: offer,
          score: adjustedScore,
          reason: index === 0 
            ? `${message} (Top recommendation)` 
            : `Alternative recommendation (Rank ${index + 1})`,
          metadata: {
            type: index === 0 ? 'primary' : 'alternative',
            rank: index + 1,
            original_confidence: confidenceScore,
          }
        });
      });
      
      return recommendations;
    }

    // OLD FORMAT: recommendation object (FALLBACK)
    if (responseData.recommendation) {
      console.log('✅ Using OLD response format (recommendation object)');
      
      const rec = responseData.recommendation;
      const confidenceScore = rec.confidence_score || 0.5;

      // Add primary offer
      if (rec.primary_offer) {
        recommendations.push({
          targetOffer: rec.primary_offer,
          score: confidenceScore,
          reason: message,
          metadata: {
            type: 'primary',
            user_summary: responseData.user_summary,
          }
        });
      }

      // Add social proof offer if different
      if (rec.social_proof_offer && rec.social_proof_offer !== rec.primary_offer) {
        recommendations.push({
          targetOffer: rec.social_proof_offer,
          score: confidenceScore * 0.85,
          reason: 'Popular among users with similar usage patterns',
          metadata: {
            type: 'social_proof',
            user_summary: responseData.user_summary,
          }
        });
      }

      // Boost confidence if both agree
      if (rec.social_proof_offer === rec.primary_offer && recommendations.length === 1) {
        recommendations[0].score = Math.min(confidenceScore * 1.1, 1.0);
        recommendations[0].reason = 'Highly recommended! Both algorithms agree on this offer.';
      }

      return recommendations;
    }

    // If neither format matched
    console.warn('⚠️  Unknown response format');
    console.warn('Response keys:', Object.keys(responseData));
    
    return recommendations;
  }

  /**
   * Normalize plan type to match ML API requirements
   * @private
   */
  _normalizePlanType(planType) {
    if (!planType) return 'Prepaid';
    
    const normalized = planType.toLowerCase();
    
    // Map various formats to 'Prepaid' or 'Postpaid'
    if (normalized.includes('prepaid') || normalized === 'basic' || normalized === 'standard') {
      return 'Prepaid';
    } else if (normalized.includes('postpaid') || normalized === 'premium') {
      return 'Postpaid';
    }
    
    return 'Prepaid'; // Default
  }

  /**
   * Generate mock recommendations for testing/fallback
   * @private
   */
  _generateMockRecommendations(preferences = {}, usageFeatures = {}) {
    const usageType = preferences.usageType || 'mixed';
    const budget = preferences.budget || 'medium';
    const interests = preferences.interests || [];

    const recommendations = [];

    // Logic berdasarkan usage type
    if (usageType === 'data' || interests.includes('streaming')) {
      recommendations.push(
        { targetOffer: 'Data Booster', score: 0.9, reason: 'High data usage detected' },
        { targetOffer: 'Streaming Partner Pack', score: 0.85, reason: 'Perfect for streaming' }
      );
    }

    if (usageType === 'voice' || usageFeatures.avgCallDuration > 200) {
      recommendations.push(
        { targetOffer: 'Voice Bundle', score: 0.88, reason: 'Frequent calls detected' }
      );
    }

    if (interests.includes('gaming')) {
      recommendations.push(
        { targetOffer: 'Streaming Partner Pack', score: 0.82, reason: 'Good for online gaming' }
      );
    }

    // Budget-based recommendations
    if (budget === 'low') {
      recommendations.push(
        { targetOffer: 'Top-up Promo', score: 0.75, reason: 'Budget-friendly option' },
        { targetOffer: 'General Offer', score: 0.70, reason: 'Best value package' }
      );
    } else if (budget === 'high') {
      recommendations.push(
        { targetOffer: 'Family Plan Offer', score: 0.80, reason: 'Premium family package' },
        { targetOffer: 'Device Upgrade Offer', score: 0.78, reason: 'Upgrade to premium device' }
      );
    }

    // Default recommendations
    if (recommendations.length < 3) {
      recommendations.push(
        { targetOffer: 'General Offer', score: 0.70, reason: 'Popular combo package' },
        { targetOffer: 'Data Booster', score: 0.65, reason: 'Extra data boost' }
      );
    }

    // Roaming for travelers
    if (usageFeatures.travelScore > 0.3) {
      recommendations.push(
        { targetOffer: 'Roaming Pass', score: 0.77, reason: 'Great for travelers' }
      );
    }

    // Sort by score (highest first) and limit to top 8
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  /**
   * Health check for ML service
   */
  async healthCheck() {
    try {
      // Try to ping the ML service root
      const healthUrl = this.mlServiceUrl.replace('/recommend', '');
      
      const response = await axios.get(healthUrl, {
        timeout: 5000,
      });
      
      return {
        status: 'healthy',
        available: true,
        url: this.mlServiceUrl,
        response: response.data,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        available: false,
        url: this.mlServiceUrl,
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
      provider: 'Hugging Face',
      docs: 'https://huuddz-telco-hybrid-api.hf.space/docs',
      responseFormat: {
        primary_offer: 'Main recommendation from content-based filtering',
        social_proof_offer: 'Recommendation from collaborative filtering',
        confidence_score: 'Model confidence (0-1 scale)',
      }
    };
  }
}

module.exports = new MLService();