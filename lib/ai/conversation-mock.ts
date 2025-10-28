import { ConversationAssessment } from '../db';

/**
 * Generate mock conversation analysis results
 * This will be replaced with real AI analysis in later phases
 */
export function generateMockConversationAnalysis(): NonNullable<ConversationAssessment['analysisResults']> {
  const speech = {
    wordFindingScore: Math.floor(Math.random() * 20) + 75, // 75-95
    fluencyScore: Math.floor(Math.random() * 20) + 75,
    articulationScore: Math.floor(Math.random() * 20) + 80,
    speechRate: Math.floor(Math.random() * 40) + 110, // 110-150 words per minute
    pauseFrequency: Math.floor(Math.random() * 5) + 2, // 2-7 pauses
    fillerWordCount: Math.floor(Math.random() * 8) + 2, // 2-10 filler words
  };

  const language = {
    vocabularyDiversity: Math.floor(Math.random() * 15) + 75, // 75-90
    sentenceComplexity: Math.floor(Math.random() * 20) + 70,
    semanticCoherence: Math.floor(Math.random() * 20) + 75,
    grammarAccuracy: Math.floor(Math.random() * 15) + 80,
  };

  const memory = {
    shortTermRecall: Math.floor(Math.random() * 20) + 75,
    temporalOrientation: Math.floor(Math.random() * 20) + 80,
    narrativeCoherence: Math.floor(Math.random() * 20) + 70,
  };

  const cognitive = {
    topicMaintenance: Math.floor(Math.random() * 20) + 75,
    abstractThinking: Math.floor(Math.random() * 20) + 70,
    problemSolving: Math.floor(Math.random() * 20) + 75,
  };

  // Calculate overall score (weighted average)
  const scores = [
    ...Object.values(speech).filter(v => typeof v === 'number' && v <= 100),
    ...Object.values(language),
    ...Object.values(memory),
    ...Object.values(cognitive),
  ];
  
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  let riskLevel: 'low' | 'moderate' | 'high' = 'low';
  if (overallScore < 70) riskLevel = 'high';
  else if (overallScore < 85) riskLevel = 'moderate';

  const indicators: string[] = [];
  const recommendations: string[] = [];

  // Generate indicators based on scores
  if (speech.wordFindingScore < 80) {
    indicators.push('Mild word-finding difficulty detected');
    recommendations.push('Practice word association exercises daily');
  }
  if (speech.fluencyScore < 80) {
    indicators.push('Speech fluency shows some hesitation');
  }
  if (language.vocabularyDiversity < 80) {
    indicators.push('Vocabulary could be more varied');
    recommendations.push('Try reading diverse materials to expand vocabulary');
  }
  if (memory.shortTermRecall < 80) {
    indicators.push('Short-term recall shows mild difficulty');
    recommendations.push('Use memory aids and mnemonics for important information');
  }
  if (cognitive.topicMaintenance < 80) {
    indicators.push('Occasional topic drift observed');
  }

  // Always add general recommendation
  recommendations.push('Continue regular conversation assessments to track progress');
  if (riskLevel === 'moderate' || riskLevel === 'high') {
    recommendations.push('Consider discussing results with healthcare provider');
  }

  return {
    speech,
    language,
    memory,
    cognitive,
    overallScore,
    riskLevel,
    indicators,
    recommendations,
  };
}

