// src/services/usageProfileService.js (ENHANCED)

const UsageProfile = require('../models/UsageProfile');
const User = require('../models/User');

/**
 * Enhanced Usage Profile Service
 * Better integration with ML features and user data
 */
class UsageProfileService {
  /**
   * Get or create usage profile for user
   */
  async getOrCreateProfile(userId) {
    let profile = await UsageProfile.findOne({ userId });

    if (!profile) {
      console.log(`📝 Creating new usage profile for user: ${userId}`);
      
      // Get user data for better defaults
      const user = await User.findById(userId).lean();
      
      // Create profile with intelligent defaults
      profile = new UsageProfile({
        userId,
        deviceInfo: {
          brand: user?.deviceBrand || 'Unknown',
        },
        stats: {
          avgDataUsage: { 
            daily: 200, 
            weekly: 1400, 
            monthly: 5000 
          },
          avgCallDuration: { 
            daily: 3, 
            weekly: 21, 
            monthly: 100 
          },
          avgSms: { 
            daily: 2, 
            weekly: 14, 
            monthly: 50 
          },
          avgMonthlySpending: 75000,
          pctVideoUsage: 0.3,
          topupFreq: 1,
          complaintCount: 0,
        },
        patterns: {
          isHeavyDataUser: false,
          preferredContentType: user?.preferences?.usageType || 'mixed',
          roamingFrequency: 'never',
          hasFamilyPlan: false,
          rechargePattern: 'monthly',
          travelScore: 0.1,
        },
        mlMetadata: {
          userSegment: this._inferUserSegment(user?.preferences),
          planType: user?.planType || 'Prepaid',
        },
        dataQuality: {
          completeness: 0.5,
          dataPoints: 0,
        },
      });

      await profile.save();
      console.log('✅ Usage profile created with smart defaults');
    }

    return profile;
  }

  /**
   * Get ML features from usage profile
   * ENHANCED: Better feature extraction aligned with ML API
   */
  async getMLFeatures(userId) {
    const profile = await this.getOrCreateProfile(userId);

    // Return features in exact format required by ML service
    const features = {
      // Usage patterns (validated data types)
      avgDataUsage: Number(profile.stats.avgDataUsage.monthly) || 5000,
      avgCallDuration: Number(profile.stats.avgCallDuration.monthly) || 100,
      avgSmsCount: Number(profile.stats.avgSms.monthly) || 50,
      avgSpending: Number(profile.stats.avgMonthlySpending) || 75000,
      pctVideoUsage: Number(profile.stats.pctVideoUsage) || 0.3,
      topupFreq: Number(profile.stats.topupFreq) || 1,
      complaintCount: Number(profile.stats.complaintCount) || 0,

      // Behavioral
      isHeavyDataUser: Boolean(profile.patterns.isHeavyDataUser),
      contentType: String(profile.patterns.preferredContentType || 'mixed'),
      roamingFrequency: String(profile.patterns.roamingFrequency || 'never'),
      hasFamilyPlan: Boolean(profile.patterns.hasFamilyPlan),
      travelScore: Number(profile.patterns.travelScore) || 0.1,

      // Device
      deviceBrand: String(profile.deviceInfo?.brand || 'Samsung'),
      deviceOS: String(profile.deviceInfo?.os || 'Unknown'),

      // ML metadata
      userSegment: String(profile.mlMetadata.userSegment || 'balanced_user'),
      clusterLabel: profile.mlMetadata.clusterLabel || null,
      planType: String(profile.mlMetadata.planType || 'Prepaid'),

      // Data quality
      dataPoints: Number(profile.dataQuality.dataPoints) || 0,
      completeness: Number(profile.dataQuality.completeness) || 0.5,
    };

    console.log('📊 ML Features extracted:');
    console.log(`   Data usage: ${features.avgDataUsage} MB/month`);
    console.log(`   User segment: ${features.userSegment}`);
    console.log(`   Plan type: ${features.planType}`);
    console.log(`   Device: ${features.deviceBrand}`);

    return features;
  }

  /**
   * Update usage profile with new data
   */
  async updateProfile(userId, updateData) {
    const profile = await this.getOrCreateProfile(userId);

    // Update stats
    if (updateData.stats) {
      Object.assign(profile.stats, updateData.stats);
    }

    // Update patterns
    if (updateData.patterns) {
      Object.assign(profile.patterns, updateData.patterns);
    }

    // Update device info
    if (updateData.deviceInfo) {
      Object.assign(profile.deviceInfo, updateData.deviceInfo);
    }

    // Update ML metadata
    if (updateData.mlMetadata) {
      Object.assign(profile.mlMetadata, updateData.mlMetadata);
    }

    // Add usage record if provided
    if (updateData.usageRecord) {
      profile.addUsageRecord(updateData.usageRecord);
    }

    // Recalculate user segment
    profile.mlMetadata.userSegment = this._calculateUserSegment(profile);

    profile.dataQuality.lastUpdated = new Date();

    await profile.save();
    
    console.log(`✅ Usage profile updated for user: ${userId}`);
    
    return profile;
  }

  /**
   * Add usage record and auto-update stats
   */
  async addUsageRecord(userId, usageData) {
    const profile = await this.getOrCreateProfile(userId);
    profile.addUsageRecord(usageData);
    
    // Auto-update user segment based on new data
    profile.mlMetadata.userSegment = this._calculateUserSegment(profile);
    
    await profile.save();
    
    console.log(`✅ Usage record added for user: ${userId}`);
    
    return profile;
  }

  /**
   * Bulk update usage data from external source
   */
  async bulkUpdateUsageData(userId, usageData) {
    const profile = await this.getOrCreateProfile(userId);

    // Update stats from bulk data
    if (usageData.monthlyData) {
      profile.stats.avgDataUsage.monthly = usageData.monthlyData;
      profile.stats.avgDataUsage.daily = usageData.monthlyData / 30;
      profile.stats.avgDataUsage.weekly = usageData.monthlyData / 4;
    }

    if (usageData.monthlyCallDuration) {
      profile.stats.avgCallDuration.monthly = usageData.monthlyCallDuration;
      profile.stats.avgCallDuration.daily = usageData.monthlyCallDuration / 30;
      profile.stats.avgCallDuration.weekly = usageData.monthlyCallDuration / 4;
    }

    if (usageData.monthlySms) {
      profile.stats.avgSms.monthly = usageData.monthlySms;
      profile.stats.avgSms.daily = usageData.monthlySms / 30;
      profile.stats.avgSms.weekly = usageData.monthlySms / 4;
    }

    if (usageData.monthlySpending) {
      profile.stats.avgMonthlySpending = usageData.monthlySpending;
    }

    // Auto-update patterns
    profile.patterns.isHeavyDataUser = profile.stats.avgDataUsage.monthly > 10000;
    
    // Recalculate user segment
    profile.mlMetadata.userSegment = this._calculateUserSegment(profile);

    profile.dataQuality.lastUpdated = new Date();
    profile.dataQuality.dataPoints += 1;
    profile.dataQuality.completeness = this._calculateCompleteness(profile);

    await profile.save();

    console.log(`✅ Bulk usage data updated for user: ${userId}`);

    return profile;
  }

  /**
   * Get profile by userId
   */
  async getProfile(userId) {
    return await this.getOrCreateProfile(userId);
  }

  /**
   * Infer user segment from preferences
   * @private
   */
  _inferUserSegment(preferences = {}) {
    const usageType = preferences.usageType;
    const budget = preferences.budget;

    if (usageType === 'data' || budget === 'high') {
      return 'heavy_data_user';
    } else if (usageType === 'voice') {
      return 'heavy_voice_user';
    } else if (budget === 'low') {
      return 'light_user';
    }

    return 'balanced_user';
  }

  /**
   * Calculate user segment based on actual usage
   * @private
   */
  _calculateUserSegment(profile) {
    const dataUsage = profile.stats.avgDataUsage.monthly || 0;
    const callDuration = profile.stats.avgCallDuration.monthly || 0;
    const spending = profile.stats.avgMonthlySpending || 0;

    // Heavy data user: >10GB/month
    if (dataUsage > 10000) {
      return 'heavy_data_user';
    }

    // Heavy voice user: >300 min/month
    if (callDuration > 300) {
      return 'heavy_voice_user';
    }

    // Light user: <2GB and <50 min/month
    if (dataUsage < 2000 && callDuration < 50) {
      return 'light_user';
    }

    // Inactive user: very low usage
    if (dataUsage < 500 && callDuration < 20 && spending < 30000) {
      return 'inactive_user';
    }

    return 'balanced_user';
  }

  /**
   * Calculate data completeness score
   * @private
   */
  _calculateCompleteness(profile) {
    let score = 0;
    const maxScore = 10;

    // Device info (2 points)
    if (profile.deviceInfo?.brand && profile.deviceInfo.brand !== 'Unknown') score += 1;
    if (profile.deviceInfo?.os && profile.deviceInfo.os !== 'Unknown') score += 1;

    // Stats (4 points)
    if (profile.stats.avgDataUsage.monthly > 0) score += 1;
    if (profile.stats.avgCallDuration.monthly > 0) score += 1;
    if (profile.stats.avgSms.monthly > 0) score += 1;
    if (profile.stats.avgMonthlySpending > 0) score += 1;

    // Patterns (2 points)
    if (profile.patterns.preferredContentType !== 'mixed') score += 1;
    if (profile.patterns.rechargePattern !== 'monthly') score += 1;

    // History (2 points)
    if (profile.history.length > 0) score += 1;
    if (profile.history.length > 10) score += 1;

    return score / maxScore; // 0-1 scale
  }

  /**
   * Get user segment distribution (for analytics)
   */
  async getSegmentDistribution() {
    const distribution = await UsageProfile.aggregate([
      {
        $group: {
          _id: '$mlMetadata.userSegment',
          count: { $sum: 1 },
          avgDataUsage: { $avg: '$stats.avgDataUsage.monthly' },
          avgSpending: { $avg: '$stats.avgMonthlySpending' },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    return distribution;
  }

  /**
   * Sync user preferences to usage profile
   */
  async syncUserPreferences(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const profile = await this.getOrCreateProfile(userId);

    // Sync device info
    if (user.deviceBrand) {
      profile.deviceInfo.brand = user.deviceBrand;
    }

    // Sync plan type
    if (user.planType) {
      profile.mlMetadata.planType = user.planType;
    }

    // Sync preferences to patterns
    if (user.preferences) {
      if (user.preferences.usageType) {
        profile.patterns.preferredContentType = user.preferences.usageType;
      }

      // Update user segment based on preferences
      profile.mlMetadata.userSegment = this._inferUserSegment(user.preferences);
    }

    await profile.save();

    console.log(`✅ User preferences synced for: ${userId}`);

    return profile;
  }
}

module.exports = new UsageProfileService();