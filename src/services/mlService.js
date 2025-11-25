const axios = require('axios');
const config = require('../config/env');

/**
 * ML Service untuk komunikasi dengan model Machine Learning
 * SEMENTARA menggunakan MOCK DATA karena model masih dalam development
 */

class MLService {
  constructor() {
    this.mlServiceUrl = config.mlService.url;
    this.timeout = config.mlService.timeout;
  }

  /**
   * Get product recommendations for user
   * @param {Object} userData - User profile and history data
   * @returns {Promise<Array>} - Array of recommended products with scores
   */
  async getRecommendations(userData) {
    try {
      // TODO: Uncomment this when ML model is ready
      /*
      const response = await axios.post(
        `${this.mlServiceUrl}/predict`,
        {
          user_id: userData.userId,
          preferences: userData.preferences,
          usage_history: userData.usageHistory,
          algorithm: 'hybrid', // collaborative, content-based, or hybrid
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.recommendations;
      */

      // MOCK DATA - untuk sementara
      console.log('⚠️  Using MOCK ML recommendations (model not yet deployed)');
      
      return this._getMockRecommendations(userData);
      
    } catch (error) {
      console.error('ML Service Error:', error.message);
      
      // Fallback ke mock data jika ML service error
      console.log('⚠️  ML Service unavailable, using fallback recommendations');
      return this._getMockRecommendations(userData);
    }
  }

  /**
   * Train or retrain ML model (akan digunakan nanti)
   */
  async trainModel(trainingData) {
    try {
      const response = await axios.post(
        `${this.mlServiceUrl}/train`,
        trainingData,
        {
          timeout: this.timeout * 2, // Training butuh waktu lebih lama
        }
      );

      return response.data;
    } catch (error) {
      console.error('ML Training Error:', error.message);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics() {
    try {
      const response = await axios.get(
        `${this.mlServiceUrl}/metrics`,
        { timeout: this.timeout }
      );

      return response.data;
    } catch (error) {
      console.error('ML Metrics Error:', error.message);
      
      // Return mock metrics
      return {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.91,
        f1Score: 0.90,
        modelVersion: 'v1.0-mock',
      };
    }
  }

  /**
   * MOCK RECOMMENDATIONS - Temporary until ML model is ready
   * Menggunakan rule-based sederhana untuk demo
   */
  _getMockRecommendations(userData) {
    const mockRecommendations = [];
    
    // Rule-based recommendation berdasarkan preferences
    const { preferences } = userData;
    
    // Simulasi scoring (0-1)
    if (preferences?.usageType === 'data') {
      mockRecommendations.push(
        {
          score: 0.95,
          reason: 'High data usage pattern detected',
        },
        {
          score: 0.88,
          reason: 'Popular among similar users',
        },
        {
          score: 0.82,
          reason: 'Best value for data-heavy users',
        }
      );
    } else if (preferences?.usageType === 'voice') {
      mockRecommendations.push(
        {
          score: 0.93,
          reason: 'Optimized for voice calls',
        },
        {
          score: 0.85,
          reason: 'Unlimited calling hours',
        },
        {
          score: 0.79,
          reason: 'Best voice quality package',
        }
      );
    } else {
      // Default mixed recommendations
      mockRecommendations.push(
        {
          score: 0.90,
          reason: 'Best overall package for mixed usage',
        },
        {
          score: 0.84,
          reason: 'Popular combo package',
        },
        {
          score: 0.78,
          reason: 'Great value for balanced users',
        },
        {
          score: 0.72,
          reason: 'Trending among your peers',
        },
        {
          score: 0.68,
          reason: 'Budget-friendly option',
        }
      );
    }

    return mockRecommendations;
  }
}

module.exports = new MLService();