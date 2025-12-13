// src\services\usageProfileService.js

const UsageProfile = require('../models/UsageProfile');

/**
 * Service untuk mengelola Usage Profile
 */
class UsageProfileService {
  /**
   * Get atau create usage profile untuk user
   */
  async getOrCreateProfile(userId) {
    let profile = await UsageProfile.findOne({ userId });

    if (!profile) {
      // Create default profile
      profile = new UsageProfile({
        userId,
        stats: {
          avgDataUsage: { daily: 0, weekly: 0, monthly: 0 },
          avgCallDuration: { daily: 0, weekly: 0, monthly: 0 },
          avgSms: { daily: 0, weekly: 0, monthly: 0 },
          avgMonthlySpending: 0,
          pctVideoUsage: 0.3,
          topupFreq: 1,
          complaintCount: 0,
        },
        patterns: {
          isHeavyDataUser: false,
          preferredContentType: 'mixed',
          roamingFrequency: 'never',
          hasFamilyPlan: false,
          rechargePattern: 'monthly',
          travelScore: 0.1,
        },
        mlMetadata: {
          userSegment: 'balanced_user',
          planType: 'standard',
        },
        dataQuality: {
          completeness: 0.5,
          dataPoints: 0,
        },
      });

      await profile.save();
    }

    return profile;
  }

  /**
   * Get ML features dari usage profile
   */
  async getMLFeatures(userId) {
    const profile = await this.getOrCreateProfile(userId);

    // Return features in format yang dibutuhkan ML service
    return {
      // Usage patterns
      avgDataUsage: profile.stats.avgDataUsage.monthly || 0,
      avgCallDuration: profile.stats.avgCallDuration.monthly || 0,
      avgSmsCount: profile.stats.avgSms.monthly || 0,
      avgSpending: profile.stats.avgMonthlySpending || 0,
      pctVideoUsage: profile.stats.pctVideoUsage || 0.3,
      topupFreq: profile.stats.topupFreq || 1,
      complaintCount: profile.stats.complaintCount || 0,

      // Behavioral
      isHeavyDataUser: profile.patterns.isHeavyDataUser || false,
      contentType: profile.patterns.preferredContentType || 'mixed',
      roamingFrequency: profile.patterns.roamingFrequency || 'never',
      hasFamilyPlan: profile.patterns.hasFamilyPlan || false,
      travelScore: profile.patterns.travelScore || 0.1,

      // Device
      deviceBrand: profile.deviceInfo?.brand || 'Unknown',
      deviceOS: profile.deviceInfo?.os || 'Unknown',

      // ML metadata
      userSegment: profile.mlMetadata.userSegment || 'balanced_user',
      clusterLabel: profile.mlMetadata.clusterLabel || null,
      planType: profile.mlMetadata.planType || 'standard',

      // Data quality
      dataPoints: profile.dataQuality.dataPoints || 0,
      completeness: profile.dataQuality.completeness || 0.5,
    };
  }

  /**
   * Update usage profile dengan data baru
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

    // Recalculate averages if new history added
    if (updateData.usageRecord) {
      profile.addUsageRecord(updateData.usageRecord);
    }

    profile.dataQuality.lastUpdated = new Date();

    await profile.save();
    return profile;
  }

  /**
   * Add usage record
   */
  async addUsageRecord(userId, usageData) {
    const profile = await this.getOrCreateProfile(userId);
    profile.addUsageRecord(usageData);
    await profile.save();
    return profile;
  }

  /**
   * Get profile by userId
   */
  async getProfile(userId) {
    return await this.getOrCreateProfile(userId);
  }
}

module.exports = new UsageProfileService();