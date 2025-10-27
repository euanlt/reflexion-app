import Dexie, { Table } from 'dexie';

export interface CheckInSession {
  id?: number;
  date: string;
  tasks: {
    memory?: any;
    emotion?: any;
    speech?: any;
  };
  overallScore: number;
  duration: number;
  completedAt: string;
}

export interface VideoAssessment {
  id?: number;
  sessionId?: number;
  taskType: 'finger-tap' | 'hand-movement' | 'arm-raise' | 'custom';
  videoBlob?: Blob;
  videoDuration: number;
  analysisResults?: {
    movement: {
      coordinationScore: number;
      balanceScore: number;
      speedScore: number;
      rangeOfMotion: number;
      smoothness: number;
      symmetry: number;
      tremor: 'none' | 'mild' | 'moderate' | 'severe';
      abnormalMovements: string[];
    };
    facial: {
      expressionSymmetry: number;
      eyeTracking: number;
      blinkRate: number;
      facialTone: 'normal' | 'reduced' | 'increased';
      emotionalExpression: 'appropriate' | 'flat' | 'exaggerated';
    };
    posture: {
      alignment: number;
      stability: number;
      headPosition: 'normal' | 'forward' | 'tilted';
      shoulderLevel: 'even' | 'uneven';
      trunkPosition: 'upright' | 'leaning' | 'slouched';
    };
    overallScore: number;
    riskLevel: 'low' | 'moderate' | 'high';
    recommendations: string[];
  };
  recordedAt: string;
  analyzedAt?: string;
  // Huawei Cloud OBS references
  obsVideoKey?: string;
  obsResultsKey?: string;
  cloudSyncStatus?: 'pending' | 'uploading' | 'synced' | 'failed';
  cloudSyncedAt?: string;
  userId?: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  age: number;
  caregiverContact?: string;
  preferences: {
    fontSize: 'normal' | 'large' | 'extra-large';
    voiceEnabled: boolean;
    reminderTime: string;
  };
  baseline?: {
    memoryScore: number;
    speechPattern: any;
    emotionBaseline: any;
  };
}

export class ReflexionDB extends Dexie {
  checkInSessions!: Table<CheckInSession>;
  userProfile!: Table<UserProfile>;
  videoAssessments!: Table<VideoAssessment>;

  constructor() {
    super('ReflexionDB');
    this.version(1).stores({
      checkInSessions: '++id, date, overallScore, completedAt',
      userProfile: '++id, name, age'
    });
    this.version(2).stores({
      checkInSessions: '++id, date, overallScore, completedAt',
      userProfile: '++id, name, age',
      videoAssessments: '++id, sessionId, taskType, recordedAt, analyzedAt'
    });
    this.version(3).stores({
      checkInSessions: '++id, date, overallScore, completedAt',
      userProfile: '++id, name, age',
      videoAssessments: '++id, sessionId, taskType, recordedAt, analyzedAt, cloudSyncStatus, userId, obsVideoKey'
    });
  }
}

export const db = new ReflexionDB();

// Helper functions
export const saveCheckInSession = async (session: Omit<CheckInSession, 'id'>) => {
  return await db.checkInSessions.add(session);
};

export const getRecentSessions = async (days: number = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return await db.checkInSessions
    .where('date')
    .above(cutoffDate.toISOString().split('T')[0])
    .toArray();
};

export const getUserProfile = async () => {
  const profiles = await db.userProfile.toArray();
  return profiles[0] || null;
};

export const saveUserProfile = async (profile: Omit<UserProfile, 'id'>) => {
  const existing = await getUserProfile();
  if (existing) {
    return await db.userProfile.update(existing.id!, profile);
  } else {
    return await db.userProfile.add(profile);
  }
};

// Video assessment functions
export const saveVideoAssessment = async (assessment: Omit<VideoAssessment, 'id'>) => {
  return await db.videoAssessments.add(assessment);
};

export const getVideoAssessments = async (limit: number = 10) => {
  return await db.videoAssessments
    .orderBy('recordedAt')
    .reverse()
    .limit(limit)
    .toArray();
};

export const getVideoAssessmentsByType = async (taskType: string) => {
  return await db.videoAssessments
    .where('taskType')
    .equals(taskType)
    .toArray();
};

export const updateVideoAssessmentAnalysis = async (
  id: number, 
  analysisResults: VideoAssessment['analysisResults']
) => {
  return await db.videoAssessments.update(id, {
    analysisResults,
    analyzedAt: new Date().toISOString()
  });
};

// OBS-related functions
export const updateVideoAssessmentCloudSync = async (
  id: number,
  obsVideoKey: string,
  obsResultsKey: string
) => {
  return await db.videoAssessments.update(id, {
    obsVideoKey,
    obsResultsKey,
    cloudSyncStatus: 'synced',
    cloudSyncedAt: new Date().toISOString()
  });
};

export const getVideoAssessmentsByCloudStatus = async (status: VideoAssessment['cloudSyncStatus']) => {
  if (!status) {
    return [];
  }
  return await db.videoAssessments
    .where('cloudSyncStatus')
    .equals(status)
    .toArray();
};