const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service untuk komunikasi dengan model Machine Learning
 */
class MLService {
  constructor() {
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
  }

  /**
   * Get product recommendations for user
   */
  async getRecommendations(userData) {
    console.log('🤖 MLService.getRecommendations called');
    console.log('📤 User data:', JSON.stringify(userData, null, 2));

    try {
      // Try to call actual ML service
      console.log('🌐 Attempting to connect to ML service at:', this.mlServiceUrl);
      
      const mlRequestData = this._transformToMLFormat(userData);
      console.log('📊 Transformed ML request:', JSON.stringify(mlRequestData, null, 2));
      
      const response = await axios.post(
        `${this.mlServiceUrl}/predict`,
        mlRequestData,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('✅ ML service response received');
      console.log('📊 Raw ML response:', JSON.stringify(response.data, null, 2));

      const recommendations = this._transformMLResponse(response.data);
      console.log('📊 Transformed recommendations:', recommendations.length);

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
        console.error('🔌 ML service is not running at', this.mlServiceUrl);
      }
      
      // Fallback to mock data
      console.log('⚠️  Falling back to mock recommendations');
      return this._getMockRecommendations(userData);
    }
  }

  /**
   * Transform backend data format to ML service format
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
    
    return {
      avg_data_usage_gb: avgDataUsageGB,
      pct_video_usage: pctVideoUsage,
      avg_call_duration: usageFeatures.avgCallDuration || 0,
      sms_freq: usageFeatures.avgSmsCount || 0,
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
   */
  _transformMLResponse(mlResponse) {
    console.log('🔄 Transforming ML response...');
    
    // Format: {"status":"success","recommendation":"Voice Bundle","confidence":36.0}
    if (mlResponse.recommendation && mlResponse.confidence !== undefined) {
      return [{
        product_name: mlResponse.recommendation,
        score: mlResponse.confidence / 100,
        reason: `Recommended based on ML model with ${mlResponse.confidence.toFixed(1)}% confidence`
      }];
    }
    
    // Format: Array of recommendations
    if (Array.isArray(mlResponse)) {
      return mlResponse.map(rec => ({
        product_id: rec.product_id || rec.productId,
        product_name: rec.product_name || rec.productName,
        score: rec.score || rec.confidence || 0.5,
        reason: rec.reason || rec.explanation || 'Recommended based on your usage pattern'
      }));
    }
    
    // Format: Object with recommendations property
    if (mlResponse.recommendations) {
      return mlResponse.recommendations.map(rec => ({
        product_id: rec.product_id || rec.productId,
        product_name: rec.product_name || rec.productName,
        score: rec.score || rec.confidence || 0.5,
        reason: rec.reason || rec.explanation || 'Recommended based on your usage pattern'
      }));
    }
    
    // Format: Object with predicted_products
    if (mlResponse.predicted_products) {
      return mlResponse.predicted_products.map((productId, index) => ({
        product_id: productId,
        score: mlResponse.scores ? mlResponse.scores[index] : 0.9 - (index * 0.1),
        reason: `Recommendation ${index + 1} based on ML model`
      }));
    }
    
    console.warn('⚠️  Unknown ML response format:', mlResponse);
    return [];
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
          product_name: 'Paket Internet Unlimited',
          score: 0.95,
          reason: 'Heavy data usage detected - unlimited plan recommended',
        },
        {
          product_name: 'Paket Data 50GB',
          score: 0.88,
          reason: 'High data quota with streaming features',
        }
      );
    }
    
    // Rule 2: Voice users
    else if (usageFeatures.userSegment === 'heavy_voice_user' || preferences.usageType === 'voice') {
      mockRecommendations.push(
        {
          product_name: 'Paket Telepon Unlimited',
          score: 0.93,
          reason: 'Optimized for voice calls based on your usage',
        },
        {
          product_name: 'Paket Nelpon 300 Menit',
          score: 0.85,
          reason: 'Great for regular callers',
        }
      );
    }
    
    // Rule 3: Streaming users
    else if (usageFeatures.contentType === 'video' || preferences.interests?.includes('streaming')) {
      mockRecommendations.push(
        {
          product_name: 'Paket Netflix Premium',
          score: 0.91,
          reason: 'Perfect for video streaming based on your habits',
        },
        {
          product_name: 'Paket Streaming HD',
          score: 0.86,
          reason: 'High-speed streaming package',
        }
      );
    }
    
    // Rule 4: Data preference
    else if (preferences.usageType === 'data') {
      mockRecommendations.push(
        {
          product_name: 'Paket Data 25GB',
          score: 0.90,
          reason: 'Best data package for your preference',
        },
        {
          product_name: 'Paket Data 10GB',
          score: 0.84,
          reason: 'Popular among data users',
        }
      );
    }
    
    // Default recommendations
    else {
      mockRecommendations.push(
        {
          product_name: 'Paket Combo Hemat',
          score: 0.87,
          reason: 'Best overall package for balanced usage',
        },
        {
          product_name: 'Paket Data 25GB',
          score: 0.82,
          reason: 'Popular combo package',
        },
        {
          product_name: 'Paket Combo Lengkap',
          score: 0.78,
          reason: 'Great value for your spending pattern',
        },
        {
          product_name: 'Paket Data 10GB',
          score: 0.72,
          reason: 'Budget-friendly option',
        },
        {
          product_name: 'Paket Combo Mini',
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
   */
  async healthCheck() {
    try {
      const response = await axios.get(
        `${this.mlServiceUrl}/health`,
        { timeout: 5000 }
      );
      
      return {
        status: 'healthy',
        ...response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}

module.exports = new MLService();