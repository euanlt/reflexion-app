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

  constructor() {
    super('ReflexionDB');
    this.version(1).stores({
      checkInSessions: '++id, date, overallScore, completedAt',
      userProfile: '++id, name, age'
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