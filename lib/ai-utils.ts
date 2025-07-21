// AI utility functions for processing cognitive data

export interface EmotionData {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export interface SpeechData {
  transcript: string;
  wordsPerMinute: number;
  pausePatterns: number[];
  clarity: number;
  timestamp: number;
}

export interface MemoryData {
  correctAnswers: number;
  totalQuestions: number;
  responseTime: number[];
  accuracy: number;
  timestamp: number;
}

export const analyzeEmotionTrends = (emotionHistory: EmotionData[]) => {
  if (emotionHistory.length === 0) return { trend: 'stable', confidence: 0 };

  const recentEmotions = emotionHistory.slice(-7); // Last 7 days
  const positiveEmotions = ['happy', 'content', 'calm', 'surprised'];
  
  const positiveCount = recentEmotions.filter(e => 
    positiveEmotions.includes(e.emotion.toLowerCase())
  ).length;
  
  const positiveRatio = positiveCount / recentEmotions.length;
  
  let trend = 'stable';
  if (positiveRatio > 0.7) trend = 'improving';
  else if (positiveRatio < 0.3) trend = 'declining';
  
  return {
    trend,
    confidence: Math.round(positiveRatio * 100),
    emotionDistribution: recentEmotions.reduce((acc, e) => {
      acc[e.emotion] = (acc[e.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
};

export const analyzeSpeechPatterns = (speechHistory: SpeechData[]) => {
  if (speechHistory.length === 0) return { trend: 'stable', metrics: {} };

  const recent = speechHistory.slice(-7);
  const avgWPM = recent.reduce((sum, s) => sum + s.wordsPerMinute, 0) / recent.length;
  const avgClarity = recent.reduce((sum, s) => sum + s.clarity, 0) / recent.length;
  
  // Compare with baseline (assuming normal ranges)
  const normalWPMRange = [120, 160];
  const normalClarityRange = [0.7, 1.0];
  
  const wpmStatus = avgWPM >= normalWPMRange[0] && avgWPM <= normalWPMRange[1] ? 'normal' : 
                   avgWPM < normalWPMRange[0] ? 'slow' : 'fast';
  
  const clarityStatus = avgClarity >= normalClarityRange[0] ? 'clear' : 'unclear';
  
  return {
    trend: wpmStatus === 'normal' && clarityStatus === 'clear' ? 'stable' : 'attention_needed',
    metrics: {
      averageWPM: Math.round(avgWPM),
      averageClarity: Math.round(avgClarity * 100),
      wpmStatus,
      clarityStatus
    }
  };
};

export const analyzeMemoryPerformance = (memoryHistory: MemoryData[]) => {
  if (memoryHistory.length === 0) return { trend: 'stable', metrics: {} };

  const recent = memoryHistory.slice(-7);
  const avgAccuracy = recent.reduce((sum, m) => sum + m.accuracy, 0) / recent.length;
  const avgResponseTime = recent.reduce((sum, m) => 
    sum + (m.responseTime.reduce((a, b) => a + b, 0) / m.responseTime.length), 0
  ) / recent.length;
  
  // Determine trend
  let trend = 'stable';
  if (recent.length >= 3) {
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.accuracy, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.accuracy, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.1) trend = 'improving';
    else if (secondAvg < firstAvg - 0.1) trend = 'declining';
  }
  
  return {
    trend,
    metrics: {
      averageAccuracy: Math.round(avgAccuracy * 100),
      averageResponseTime: Math.round(avgResponseTime),
      consistency: calculateConsistency(recent.map(m => m.accuracy))
    }
  };
};

export const calculateOverallCognitiveScore = (
  memoryData: MemoryData[],
  speechData: SpeechData[],
  emotionData: EmotionData[]
) => {
  const memoryAnalysis = analyzeMemoryPerformance(memoryData);
  const speechAnalysis = analyzeSpeechPatterns(speechData);
  const emotionAnalysis = analyzeEmotionTrends(emotionData);
  
  // Weight the different components
  const memoryWeight = 0.4;
  const speechWeight = 0.3;
  const emotionWeight = 0.3;
  
  const memoryScore = memoryAnalysis.metrics.averageAccuracy || 70;
  const speechScore = speechAnalysis.metrics.averageClarity || 70;
  const emotionScore = emotionAnalysis.confidence || 70;
  
  const overallScore = Math.round(
    memoryScore * memoryWeight +
    speechScore * speechWeight +
    emotionScore * emotionWeight
  );
  
  return {
    overallScore,
    breakdown: {
      memory: memoryScore,
      speech: speechScore,
      emotion: emotionScore
    },
    recommendations: generateRecommendations(memoryAnalysis, speechAnalysis, emotionAnalysis)
  };
};

const calculateConsistency = (scores: number[]) => {
  if (scores.length === 0) return 0;
  
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  return Math.max(0, Math.round((1 - standardDeviation) * 100));
};

const generateRecommendations = (memory: any, speech: any, emotion: any) => {
  const recommendations = [];
  
  if (memory.trend === 'declining') {
    recommendations.push({
      type: 'memory',
      message: 'Consider memory-strengthening exercises',
      priority: 'high'
    });
  }
  
  if (speech.trend === 'attention_needed') {
    recommendations.push({
      type: 'speech',
      message: 'Speech therapy consultation recommended',
      priority: 'medium'
    });
  }
  
  if (emotion.trend === 'declining') {
    recommendations.push({
      type: 'emotion',
      message: 'Consider discussing mood with healthcare provider',
      priority: 'medium'
    });
  }
  
  return recommendations;
};