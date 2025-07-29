import { db, CheckInSession, UserProfile, saveCheckInSession, getRecentSessions, getUserProfile as getProfile, saveUserProfile as saveProfile } from '../db';

export interface AssessmentResult {
  taskType: 'memory' | 'speech' | 'emotion' | 'moca';
  score: number;
  data: any;
  timestamp: string;
  duration: number;
}

export interface Assessment {
  id?: number;
  date: string;
  type: 'daily-checkin' | 'moca-test' | 'exercise';
  results: AssessmentResult[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  duration: number;
  completedAt: string;
}

export interface RiskScore {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  trend: 'improving' | 'stable' | 'declining';
  breakdown: Record<string, number>;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

/**
 * Unified Storage Service
 * Single source of truth for all data persistence in the Reflexion app
 */
export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Assessment Management
  async saveAssessment(assessment: Assessment): Promise<number> {
    try {
      const session: Omit<CheckInSession, 'id'> = {
        date: assessment.date,
        tasks: {
          memory: assessment.results.find(r => r.taskType === 'memory')?.data,
          emotion: assessment.results.find(r => r.taskType === 'emotion')?.data,
          speech: assessment.results.find(r => r.taskType === 'speech')?.data,
        },
        overallScore: assessment.overallScore,
        duration: assessment.duration,
        completedAt: assessment.completedAt
      };

      const sessionId = await saveCheckInSession(session);
      
      // Also update MoCA test results if applicable
      if (assessment.type === 'moca-test') {
        await this.saveMocaResults(assessment);
      }
      
      return sessionId;
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw new Error('Failed to save assessment data');
    }
  }

  async getAssessmentHistory(days?: number): Promise<Assessment[]> {
    try {
      const sessions = await getRecentSessions(days || 30);
      return sessions.map(session => this.sessionToAssessment(session));
    } catch (error) {
      console.error('Error retrieving assessments:', error);
      return [];
    }
  }

  async getLatestAssessment(): Promise<Assessment | null> {
    const assessments = await this.getAssessmentHistory(1);
    return assessments[0] || null;
  }

  // User Profile Management
  async getUserProfile(): Promise<UserProfile | null> {
    return await getProfile();
  }

  async saveUserProfile(profile: Omit<UserProfile, 'id'>): Promise<void> {
    await saveProfile(profile);
  }

  async updateUserPreferences(preferences: Partial<UserProfile['preferences']>): Promise<void> {
    const profile = await this.getUserProfile();
    if (profile) {
      await saveProfile({
        ...profile,
        preferences: { ...profile.preferences, ...preferences }
      });
    }
  }

  // Risk Score Calculation
  async calculateRiskScore(): Promise<RiskScore> {
    const assessments = await this.getAssessmentHistory(30);
    
    if (assessments.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'low',
        trend: 'stable',
        breakdown: {}
      };
    }

    // Get latest assessment for current score
    const latest = assessments[assessments.length - 1];
    
    // Calculate trend
    const recentScores = assessments.slice(-7).map(a => a.overallScore);
    const trend = this.calculateTrend(recentScores);
    
    // Calculate breakdown
    const breakdown: Record<string, number> = {};
    latest.results.forEach(result => {
      breakdown[result.taskType] = result.score;
    });

    return {
      overallScore: latest.overallScore,
      riskLevel: latest.riskLevel,
      trend,
      breakdown
    };
  }

  // Emergency Contacts
  async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const stored = localStorage.getItem('emergency-contacts');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
  }

  // MoCA Test Results (separate storage for detailed results)
  async saveMocaResults(assessment: Assessment): Promise<void> {
    const mocaHistory = await this.getMocaHistory();
    mocaHistory.push({
      date: assessment.date,
      score: assessment.overallScore,
      sections: assessment.results,
      completedAt: assessment.completedAt
    });
    localStorage.setItem('moca-history', JSON.stringify(mocaHistory));
  }

  async getMocaHistory(): Promise<any[]> {
    try {
      const stored = localStorage.getItem('moca-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Data Export/Import
  async exportAllData(): Promise<string> {
    const [profile, assessments, mocaHistory, emergencyContacts] = await Promise.all([
      this.getUserProfile(),
      this.getAssessmentHistory(),
      this.getMocaHistory(),
      this.getEmergencyContacts()
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      userProfile: profile,
      assessments,
      mocaHistory,
      emergencyContacts,
      summary: {
        totalAssessments: assessments.length,
        averageScore: assessments.length > 0 
          ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / assessments.length)
          : 0
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  async clearAllData(): Promise<void> {
    await db.checkInSessions.clear();
    await db.userProfile.clear();
    localStorage.removeItem('moca-history');
    localStorage.removeItem('emergency-contacts');
  }

  // Helper Methods
  private sessionToAssessment(session: CheckInSession): Assessment {
    const results: AssessmentResult[] = [];
    
    if (session.tasks.memory) {
      results.push({
        taskType: 'memory',
        score: session.tasks.memory.score || 0,
        data: session.tasks.memory,
        timestamp: session.completedAt,
        duration: 0
      });
    }
    
    if (session.tasks.emotion) {
      results.push({
        taskType: 'emotion',
        score: session.tasks.emotion.score || 0,
        data: session.tasks.emotion,
        timestamp: session.completedAt,
        duration: 0
      });
    }
    
    if (session.tasks.speech) {
      results.push({
        taskType: 'speech',
        score: session.tasks.speech.score || 0,
        data: session.tasks.speech,
        timestamp: session.completedAt,
        duration: 0
      });
    }

    const riskLevel = session.overallScore >= 70 ? 'high' : 
                     session.overallScore >= 40 ? 'medium' : 'low';

    return {
      id: session.id,
      date: session.date,
      type: 'daily-checkin',
      results,
      overallScore: session.overallScore,
      riskLevel,
      duration: session.duration,
      completedAt: session.completedAt
    };
  }

  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 3) return 'stable';
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 5) return 'improving';
    if (secondAvg < firstAvg - 5) return 'declining';
    return 'stable';
  }

  // Static weight calculation for risk scores
  static calculateWeightedScore(results: AssessmentResult[]): number {
    const weights = {
      memory: 0.4,
      speech: 0.3,
      emotion: 0.3,
      moca: 1.0
    };

    let weightedSum = 0;
    let totalWeight = 0;

    results.forEach(result => {
      const weight = weights[result.taskType] || 0;
      weightedSum += result.score * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();