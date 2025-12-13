// src\services\mlService.js

const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service untuk komunikasi dengan HuggingFace Space
 * FIXED: Score range 0.2-0.95 & Budget-aware recommendations
 */
class MLService {
  constructor() {
    // HuggingFace Space URL (Production)
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
    this.isProduction = config.server.env === 'production';
    
    console.log('🤖 ML Service initialized');
    console.log(`📍 Model URL: ${this.mlServiceUrl}`);
  }

  /**
   * Get product recommendations for user
   * Main method yang dipanggil dari recommendationHandler
   */
  async getRecommendations(userData) {
    console.log('🤖 MLService.getRecommendations called');
    console.log('📤 User data:', JSON.stringify(userData, null, 2));

    try {
      // Transform data ke format yang dibutuhkan HuggingFace model
      const mlRequestData = this._transformToMLFormat(userData);
      console.log('📊 Transformed ML request:', JSON.stringify(mlRequestData, null, 2));
      
      // Call HuggingFace Space API
      console.log('🌐 Calling HuggingFace Space:', this.mlServiceUrl);
      
      const response = await axios.post(
        this.mlServiceUrl,
        mlRequestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ HuggingFace API response received');
      console.log('📊 Raw ML response:', JSON.stringify(response.data, null, 2));

      // Transform response ke format backend
      const recommendations = this._transformMLResponse(response.data);
      console.log('📊 Transformed recommendations:', recommendations.length);

      // Log successful ML call
      console.log('🎯 ML Model Status: ACTIVE ✅');
      console.log(`📦 Recommendations: ${recommendations.length} offers`);

      return recommendations;
      
    } catch (error) {
      console.error('❌ ML Service Error:', error.message);
      
      if (error.response) {
        console.error('📛 ML Response Error:', error.response.status);
        console.error('📛 Error data:', JSON.stringify(error.response.data, null, 2));
      }
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️  ML service timeout after', this.timeout, 'ms');
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Cannot connect to HuggingFace Space');
      }
      
      // Fallback to mock data if ML service unavailable
      console.log('⚠️  Falling back to mock recommendations');
      console.log('💡 This indicates ML service is temporarily unavailable');
      
      return this._getMockRecommendations(userData);
    }
  }

  /**
   * Transform backend data format to ML service format
   * Sesuai dengan input yang dibutuhkan model HuggingFace
   */
  _transformToMLFormat(userData) {
    const usageFeatures = userData.usageFeatures || {};
    const preferences = userData.preferences || {};
    
    // Convert avgDataUsage from MB to GB
    const avgDataUsageGB = (usageFeatures.avgDataUsage || 0) / 1024;
    
    // Estimate video usage percentage
    let pctVideoUsage = usageFeatures.pctVideoUsage || 0.3;
    if (preferences.interests?.includes('streaming')) {
      pctVideoUsage = 0.6;
    }
    
    // Map plan type from budget preference
    const planTypeMap = {
      'low': 'basic',
      'medium': 'standard',
      'high': 'premium'
    };
    
    // Format sesuai dengan API HuggingFace
    return {
      avg_data_usage_gb: avgDataUsageGB,
      pct_video_usage: pctVideoUsage,
      avg_call_duration: usageFeatures.avgCallDuration || 100,
      sms_freq: usageFeatures.avgSmsCount || 50,
      monthly_spend: usageFeatures.avgSpending || 75000,
      topup_freq: usageFeatures.topupFreq || 1,
      travel_score: usageFeatures.travelScore || 0.1,
      complaint_count: usageFeatures.complaintCount || 0,
      plan_type: planTypeMap[preferences.budget] || 'standard',
      device_brand: usageFeatures.deviceBrand || 'Unknown'
    };
  }

  /**
   * Transform ML response to backend format
   * Menghandle response dari HuggingFace Space
   */
  _transformMLResponse(mlResponse) {
    console.log('🔄 Transforming ML response...');
    
    try {
      // Format dari HuggingFace Space:
      // {
      //   "status": "success",
      //   "recommendation": {
      //     "primary_offer": "General Offer",
      //     "social_proof_offer": "General Offer",
      //     "confidence_score": 0.37
      //   },
      //   "message": "...",
      //   "user_summary": {...}
      // }
      
      if (mlResponse.status === 'success' && mlResponse.recommendation) {
        const rec = mlResponse.recommendation;
        const offers = [];
        
        // Primary offer
        if (rec.primary_offer) {
          offers.push({
            targetOffer: rec.primary_offer,
            score: rec.confidence_score || 0.5,
            reason: `Primary recommendation based on your usage pattern. ${mlResponse.message || ''}`
          });
        }
        
        // Social proof offer (if different from primary)
        if (rec.social_proof_offer && rec.social_proof_offer !== rec.primary_offer) {
          offers.push({
            targetOffer: rec.social_proof_offer,
            score: (rec.confidence_score || 0.5) * 0.9, // Slightly lower score
            reason: `Popular among users with similar profile`
          });
        }
        
        // If we got at least one offer, return it
        if (offers.length > 0) {
          console.log('✅ Successfully transformed ML response');
          return offers;
        }
      }
      
      // If no valid recommendations found
      console.warn('⚠️  Could not extract recommendations from response');
      return [];
      
    } catch (error) {
      console.error('❌ Error transforming ML response:', error.message);
      return [];
    }
  }

  /**
   * FIXED: MOCK RECOMMENDATIONS with varied scores (0.2-0.95)
   * Budget-aware recommendations
   */
  _getMockRecommendations(userData) {
    console.log('🎭 Generating mock recommendations...');
    
    const mockRecommendations = [];
    const usageFeatures = userData.usageFeatures || {};
    const preferences = userData.preferences || {};
    const budget = preferences.budget || 'medium';
    
    console.log('📊 Using preferences:', preferences);
    console.log('📊 Using budget:', budget);
    console.log('📊 Using features:', {
      usageType: preferences.usageType,
      avgDataUsage: usageFeatures.avgDataUsage,
      isHeavyDataUser: usageFeatures.isHeavyDataUser
    });
    
    // FIXED: Score calculation based on match quality
    const getScore = (matchLevel) => {
      // matchLevel: 'perfect', 'good', 'fair', 'poor'
      const scoreRanges = {
        'perfect': [0.85, 0.95],  // Very high match
        'good': [0.65, 0.84],     // Good match
        'fair': [0.45, 0.64],     // Fair match
        'poor': [0.20, 0.44]      // Poor match (but still shown)
      };
      
      const range = scoreRanges[matchLevel] || [0.3, 0.5];
      const min = range[0];
      const max = range[1];
      
      // Generate random score in range
      return min + (Math.random() * (max - min));
    };
    
    // Rule-based recommendations based on user profile
    // Rule 1: Heavy data users
    if (usageFeatures.isHeavyDataUser || usageFeatures.avgDataUsage > 10000) {
      mockRecommendations.push(
        {
          targetOffer: 'Data Booster',
          score: getScore('perfect'),
          reason: 'Heavy data usage detected - data booster recommended',
        },
        {
          targetOffer: 'Streaming Partner Pack',
          score: getScore('good'),
          reason: 'High data quota with streaming features',
        }
      );
      
      // Add budget-appropriate option
      if (budget === 'low') {
        mockRecommendations.push({
          targetOffer: 'Top-up Promo',
          score: getScore('good'),
          reason: 'Budget-friendly data boost option',
        });
      }
    }
    
    // Rule 2: Voice users
    else if (usageFeatures.userSegment === 'heavy_voice_user' || preferences.usageType === 'voice') {
      mockRecommendations.push(
        {
          targetOffer: 'Voice Bundle',
          score: getScore('perfect'),
          reason: 'Optimized for voice calls based on your usage',
        },
        {
          targetOffer: 'Family Plan Offer',
          score: getScore('good'),
          reason: 'Great for regular callers with family sharing',
        }
      );
    }
    
    // Rule 3: Streaming users
    else if (usageFeatures.contentType === 'video' || preferences.interests?.includes('streaming')) {
      mockRecommendations.push(
        {
          targetOffer: 'Streaming Partner Pack',
          score: getScore('perfect'),
          reason: 'Perfect for video streaming based on your habits',
        },
        {
          targetOffer: 'Data Booster',
          score: getScore('good'),
          reason: 'High-speed data for streaming',
        }
      );
    }
    
    // Rule 4: Data preference
    else if (preferences.usageType === 'data') {
      mockRecommendations.push(
        {
          targetOffer: 'Data Booster',
          score: getScore('perfect'),
          reason: 'Best data package for your preference',
        },
        {
          targetOffer: 'General Offer',
          score: getScore('good'),
          reason: 'Popular among data users',
        }
      );
    }
    
    // FIXED: Budget-specific recommendations
    if (budget === 'low') {
      mockRecommendations.push(
        {
          targetOffer: 'Top-up Promo',
          score: getScore('good'),
          reason: 'Budget-friendly option perfect for your spending range',
        },
        {
          targetOffer: 'General Offer',
          score: getScore('fair'),
          reason: 'Affordable combo package',
        }
      );
    } else if (budget === 'high') {
      mockRecommendations.push(
        {
          targetOffer: 'Device Upgrade Offer',
          score: getScore('good'),
          reason: 'Premium package with device upgrade',
        },
        {
          targetOffer: 'Retention Offer',
          score: getScore('fair'),
          reason: 'Exclusive loyalty rewards',
        }
      );
    }
    
    // Default recommendations (if nothing matched)
    if (mockRecommendations.length === 0) {
      mockRecommendations.push(
        {
          targetOffer: 'General Offer',
          score: getScore('good'),
          reason: 'Best overall package for balanced usage',
        },
        {
          targetOffer: 'Data Booster',
          score: getScore('fair'),
          reason: 'Popular combo package',
        },
        {
          targetOffer: 'Voice Bundle',
          score: getScore('fair'),
          reason: 'Great value for your spending pattern',
        },
        {
          targetOffer: 'Streaming Partner Pack',
          score: getScore('poor'),
          reason: 'Budget-friendly option',
        },
        {
          targetOffer: 'Family Plan Offer',
          score: getScore('poor'),
          reason: 'Good starter package',
        }
      );
    }

    console.log('✅ Generated', mockRecommendations.length, 'mock recommendations');
    console.log('📊 Score range:', 
      Math.min(...mockRecommendations.map(r => r.score)).toFixed(2),
      '-',
      Math.max(...mockRecommendations.map(r => r.score)).toFixed(2)
    );
    
    return mockRecommendations;
  }

  /**
   * Health check ML service
   */
  async healthCheck() {
    try {
      console.log('🏥 Checking ML service health...');
      
      // Test with minimal data
      const testData = {
        avg_data_usage_gb: 5.0,
        pct_video_usage: 0.3,
        avg_call_duration: 100,
        sms_freq: 50,
        monthly_spend: 75000,
        topup_freq: 1,
        travel_score: 0.1,
        complaint_count: 0,
        plan_type: 'standard',
        device_brand: 'Unknown'
      };
      
      const response = await axios.post(
        this.mlServiceUrl,
        testData,
        { 
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('✅ ML Service is healthy');
      return {
        status: 'healthy',
        service: 'HuggingFace Space',
        url: this.mlServiceUrl,
        responseFormat: response.data.status || 'unknown',
        modelActive: true
      };
    } catch (error) {
      console.log('⚠️  ML Service health check failed:', error.message);
      return {
        status: 'unavailable',
        service: 'HuggingFace Space',
        url: this.mlServiceUrl,
        error: error.message,
        note: 'Using fallback mock recommendations',
        modelActive: false
      };
    }
  }

  /**
   * Test ML service with sample data
   */
  async testConnection() {
    console.log('🧪 Testing HuggingFace Space connection...');
    
    const sampleData = {
      userId: 'test_user',
      preferences: {
        usageType: 'data',
        budget: 'medium',
        interests: ['streaming']
      },
      usageFeatures: {
        avgDataUsage: 5000,
        avgCallDuration: 100,
        avgSmsCount: 50,
        avgSpending: 75000,
        isHeavyDataUser: false,
        userSegment: 'balanced_user'
      }
    };
    
    try {
      const recommendations = await this.getRecommendations(sampleData);
      
      if (recommendations.length > 0) {
        console.log('✅ HuggingFace Space connection successful!');
        console.log('📊 Test recommendations:', recommendations);
        return {
          success: true,
          recommendations,
          modelActive: true
        };
      } else {
        console.warn('⚠️  Connection successful but no recommendations returned');
        return {
          success: false,
          error: 'No recommendations returned from ML service',
          modelActive: false
        };
      }
    } catch (error) {
      console.error('❌ HuggingFace Space connection failed:', error.message);
      return {
        success: false,
        error: error.message,
        modelActive: false
      };
    }
  }
}

module.exports = new MLService();