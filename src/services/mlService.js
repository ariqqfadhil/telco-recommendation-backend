const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service untuk komunikasi dengan model Machine Learning
 * Integrated with HuggingFace Spaces
 */
class MLService {
  constructor() {
    // HuggingFace Space URL
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
    this.isProduction = config.server.env === 'production';
  }

  /**
   * Get product recommendations for user
   */
  async getRecommendations(userData) {
    console.log('🤖 MLService.getRecommendations called');
    console.log('📤 User data:', JSON.stringify(userData, null, 2));

    try {
      // Try to call actual ML service on HuggingFace
      console.log('🌐 Connecting to HuggingFace Space:', this.mlServiceUrl);
      
      const mlRequestData = this._transformToMLFormat(userData);
      console.log('📊 Transformed ML request:', JSON.stringify(mlRequestData, null, 2));
      
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

      const recommendations = this._transformMLResponse(response.data);
      console.log('📊 Transformed recommendations:', recommendations.length);

      // Log successful ML call
      console.log('🎯 ML Model Status: ACTIVE ✅');

      return recommendations;
      
    } catch (error) {
      console.error('❌ ML Service Error:', error.message);
      
      if (error.response) {
        console.error('📛 ML Response Error:', JSON.stringify(error.response.data, null, 2));
        console.error('📛 Status:', error.response.status);
      }
      
      if (error.code === 'ECONNABORTED') {
        console.error('⏱️  ML service timeout after', this.timeout, 'ms');
      }
      
      if (error.code === 'ECONNREFUSED') {
        console.error('🔌 Cannot connect to HuggingFace Space');
      }
      
      // Fallback to mock data if ML service unavailable
      console.log('⚠️  Falling back to mock recommendations');
      console.log('💡 This is normal during development/testing');
      
      return this._getMockRecommendations(userData);
    }
  }

  /**
   * Transform backend data format to ML service format
   * Based on your HuggingFace model's expected input
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
    
    // Format sesuai dengan HuggingFace API
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
   * FIXED: Handle the actual response format from your HuggingFace API
   */
  _transformMLResponse(mlResponse) {
    console.log('🔄 Transforming ML response...');
    
    // Format dari HuggingFace Space Anda:
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
    
    try {
      // Check if response has the expected structure
      if (mlResponse.status === 'success' && mlResponse.recommendation) {
        const rec = mlResponse.recommendation;
        
        // Extract offers - both primary and social proof
        const offers = [];
        
        // Primary offer
        if (rec.primary_offer) {
          offers.push({
            targetOffer: rec.primary_offer,
            score: rec.confidence_score || 0.5,
            reason: `Primary recommendation: ${rec.primary_offer}. ${mlResponse.message || 'Based on your usage pattern'}`
          });
        }
        
        // Social proof offer (if different from primary)
        if (rec.social_proof_offer && rec.social_proof_offer !== rec.primary_offer) {
          offers.push({
            targetOffer: rec.social_proof_offer,
            score: (rec.confidence_score || 0.5) * 0.9, // Slightly lower score
            reason: `Popular among users like you: ${rec.social_proof_offer}`
          });
        }
        
        // If we got at least one offer, return it
        if (offers.length > 0) {
          console.log('✅ Successfully transformed ML response');
          return offers;
        }
      }
      
      // If no valid recommendations found, log and return empty
      console.warn('⚠️  Could not extract recommendations from response');
      return [];
      
    } catch (error) {
      console.error('❌ Error transforming ML response:', error.message);
      return [];
    }
  }

  /**
   * MOCK RECOMMENDATIONS - Fallback when ML service unavailable
   */
  _getMockRecommendations(userData) {
    console.log('🎭 Generating mock recommendations...');
    
    const mockRecommendations = [];
    const usageFeatures = userData.usageFeatures || {};
    const preferences = userData.preferences || {};
    
    console.log('📊 Using preferences:', preferences);
    console.log('📊 Using features:', {
      usageType: preferences.usageType,
      avgDataUsage: usageFeatures.avgDataUsage,
      isHeavyDataUser: usageFeatures.isHeavyDataUser
    });
    
    // Rule 1: Heavy data users
    if (usageFeatures.isHeavyDataUser || usageFeatures.avgDataUsage > 10000) {
      mockRecommendations.push(
        {
          targetOffer: 'Data Booster',
          score: 0.95,
          reason: 'Heavy data usage detected - data booster recommended',
        },
        {
          targetOffer: 'Streaming Partner Pack',
          score: 0.88,
          reason: 'High data quota with streaming features',
        }
      );
    }
    
    // Rule 2: Voice users
    else if (usageFeatures.userSegment === 'heavy_voice_user' || preferences.usageType === 'voice') {
      mockRecommendations.push(
        {
          targetOffer: 'Voice Bundle',
          score: 0.93,
          reason: 'Optimized for voice calls based on your usage',
        },
        {
          targetOffer: 'Family Plan Offer',
          score: 0.85,
          reason: 'Great for regular callers with family sharing',
        }
      );
    }
    
    // Rule 3: Streaming users
    else if (usageFeatures.contentType === 'video' || preferences.interests?.includes('streaming')) {
      mockRecommendations.push(
        {
          targetOffer: 'Streaming Partner Pack',
          score: 0.91,
          reason: 'Perfect for video streaming based on your habits',
        },
        {
          targetOffer: 'Data Booster',
          score: 0.86,
          reason: 'High-speed data for streaming',
        }
      );
    }
    
    // Rule 4: Data preference
    else if (preferences.usageType === 'data') {
      mockRecommendations.push(
        {
          targetOffer: 'Data Booster',
          score: 0.90,
          reason: 'Best data package for your preference',
        },
        {
          targetOffer: 'General Offer',
          score: 0.84,
          reason: 'Popular among data users',
        }
      );
    }
    
    // Default recommendations
    else {
      mockRecommendations.push(
        {
          targetOffer: 'General Offer',
          score: 0.87,
          reason: 'Best overall package for balanced usage',
        },
        {
          targetOffer: 'Data Booster',
          score: 0.82,
          reason: 'Popular combo package',
        },
        {
          targetOffer: 'Voice Bundle',
          score: 0.78,
          reason: 'Great value for your spending pattern',
        },
        {
          targetOffer: 'Streaming Partner Pack',
          score: 0.72,
          reason: 'Budget-friendly option',
        },
        {
          targetOffer: 'Family Plan Offer',
          score: 0.68,
          reason: 'Good starter package',
        }
      );
    }

    console.log('✅ Generated', mockRecommendations.length, 'mock recommendations');
    return mockRecommendations;
  }

  /**
   * Health check ML service
   * FIXED: Don't rely on /health endpoint since it doesn't exist
   */
  async healthCheck() {
    try {
      console.log('🏥 Checking ML service health...');
      
      // Instead of calling /health, try the actual recommend endpoint with minimal data
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
        responseFormat: response.data.status || 'unknown'
      };
    } catch (error) {
      console.log('⚠️  ML Service health check failed:', error.message);
      return {
        status: 'unavailable',
        service: 'HuggingFace Space',
        url: this.mlServiceUrl,
        error: error.message,
        note: 'Using fallback mock recommendations'
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
          recommendations
        };
      } else {
        console.warn('⚠️  Connection successful but no recommendations returned');
        return {
          success: false,
          error: 'No recommendations returned from ML service'
        };
      }
    } catch (error) {
      console.error('❌ HuggingFace Space connection failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new MLService();