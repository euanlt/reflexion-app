import { db, CheckInSession, saveCheckInSession, getRecentSessions } from './db';

export interface AssessmentResult {
  taskType: 'memory' | 'speech' | 'emotion';
  score: number;
  data: any;
  timestamp: string;
  duration: number;
}

export interface CompleteAssessment {
  sessionId?: number;
  date: string;
  results: AssessmentResult[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  duration: number;
  completedAt: string;
}

export class AssessmentStorage {
  
  static async saveAssessment(assessment: CompleteAssessment): Promise<number> {
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
      console.log('Assessment saved with ID:', sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error saving assessment:', error);
      throw new Error('Failed to save assessment data');
    }
  }

  static async getRecentAssessments(days: number = 7): Promise<CheckInSession[]> {
    try {
      return await getRecentSessions(days);
    } catch (error) {
      console.error('Error retrieving assessments:', error);
      return [];
    }
  }

  static async getAssessmentTrends(): Promise<{
    weeklyAverage: number;
    trend: 'improving' | 'stable' | 'declining';
    riskProgression: Array<{ date: string; score: number; risk: string }>;
  }> {
    try {
      const sessions = await getRecentSessions(30);
      
      if (sessions.length === 0) {
        return {
          weeklyAverage: 0,
          trend: 'stable',
          riskProgression: []
        };
      }

      const weeklyAverage = sessions
        .slice(-7)
        .reduce((sum, session) => sum + session.overallScore, 0) / Math.min(sessions.length, 7);

      // Calculate trend
      const recentScores = sessions.slice(-7).map(s => s.overallScore);
      const firstHalf = recentScores.slice(0, Math.floor(recentScores.length / 2));
      const secondHalf = recentScores.slice(Math.floor(recentScores.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';

      const riskProgression = sessions.map(session => ({
        date: session.date,
        score: session.overallScore,
        risk: session.overallScore >= 70 ? 'high' : session.overallScore >= 40 ? 'medium' : 'low'
      }));

      return {
        weeklyAverage: Math.round(weeklyAverage),
        trend,
        riskProgression
      };
    } catch (error) {
      console.error('Error calculating trends:', error);
      return {
        weeklyAverage: 0,
        trend: 'stable',
        riskProgression: []
      };
    }
  }

  static calculateRiskScore(results: AssessmentResult[]): {
    overallScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    breakdown: Record<string, number>;
  } {
    if (results.length === 0) {
      return {
        overallScore: 0,
        riskLevel: 'low',
        breakdown: {}
      };
    }

    // Weight different assessment types
    const weights = {
      memory: 0.4,
      speech: 0.3,
      emotion: 0.3
    };

    let weightedSum = 0;
    let totalWeight = 0;
    const breakdown: Record<string, number> = {};

    results.forEach(result => {
      const weight = weights[result.taskType] || 0;
      weightedSum += result.score * weight;
      totalWeight += weight;
      breakdown[result.taskType] = result.score;
    });

    const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallScore >= 70) riskLevel = 'high';
    else if (overallScore >= 40) riskLevel = 'medium';

    return {
      overallScore,
      riskLevel,
      breakdown
    };
  }

  static async exportData(): Promise<string> {
    try {
      const sessions = await db.checkInSessions.toArray();
      const profile = await db.userProfile.toArray();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        userProfile: profile[0] || null,
        assessmentSessions: sessions,
        summary: {
          totalSessions: sessions.length,
          averageScore: sessions.length > 0 
            ? Math.round(sessions.reduce((sum, s) => sum + s.overallScore, 0) / sessions.length)
            : 0,
          dateRange: sessions.length > 0 
            ? {
                first: sessions[0].date,
                last: sessions[sessions.length - 1].date
              }
            : null
        }
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export assessment data');
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await db.checkInSessions.clear();
      console.log('All assessment data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw new Error('Failed to clear assessment data');
    }
  }
}