import { getAssessmentHistory as getHistory } from './assessment-storage';

// Local storage key
const STORAGE_KEY = 'assessment-history';

export interface AssessmentResult {
  memoryScore: number;
  speechScore: number;
  facialScore: number;
  timestamp: Date;
}

export interface RiskCalculation {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  components: {
    memory: number;
    speech: number;
    facial: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
}

const WEIGHTS = {
  memory: 0.4,
  speech: 0.3,
  facial: 0.3,
};

const RISK_THRESHOLDS = {
  low: 30,
  high: 70,
};

export function calculateRiskScore(assessment: AssessmentResult): RiskCalculation {
  // Calculate weighted overall score
  const overallScore = Math.round(
    assessment.memoryScore * WEIGHTS.memory +
    assessment.speechScore * WEIGHTS.speech +
    assessment.facialScore * WEIGHTS.facial
  );

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (overallScore <= RISK_THRESHOLDS.low) {
    riskLevel = 'low';
  } else if (overallScore >= RISK_THRESHOLDS.high) {
    riskLevel = 'high';
  } else {
    riskLevel = 'medium';
  }

  // Get historical data for trend analysis
  const history = getHistory();
  const trend = calculateTrend(history, overallScore);
  
  // Calculate confidence based on data completeness
  const confidence = calculateConfidence(assessment);

  return {
    overallScore,
    riskLevel,
    components: {
      memory: assessment.memoryScore,
      speech: assessment.speechScore,
      facial: assessment.facialScore,
    },
    trend,
    confidence,
  };
}

function calculateTrend(
  history: any[], 
  currentScore: number
): 'improving' | 'stable' | 'declining' {
  if (history.length < 3) return 'stable';

  // Get last 7 assessments
  const recentHistory = history.slice(-7);
  const scores = recentHistory.map(a => a.overallScore);
  scores.push(currentScore);

  // Calculate simple moving average
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const difference = secondAvg - firstAvg;
  
  if (difference > 5) return 'declining';
  if (difference < -5) return 'improving';
  return 'stable';
}

function calculateConfidence(assessment: AssessmentResult): number {
  // Base confidence on data quality and completeness
  let confidence = 100;
  
  // Reduce confidence if any scores are at extremes (might indicate errors)
  if (assessment.memoryScore === 0 || assessment.memoryScore === 100) confidence -= 10;
  if (assessment.speechScore === 0 || assessment.speechScore === 100) confidence -= 10;
  if (assessment.facialScore === 0 || assessment.facialScore === 100) confidence -= 10;
  
  // Ensure confidence doesn't go below 70%
  return Math.max(70, confidence);
}

export async function saveAssessmentWithRiskCalculation(
  assessment: AssessmentResult
): Promise<RiskCalculation> {
  const riskCalculation = calculateRiskScore(assessment);
  
  // Save to localStorage
  const history = getHistory();
  const newAssessment = {
    ...assessment,
    ...riskCalculation,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  
  history.push(newAssessment);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  
  return riskCalculation;
}

export function getLatestRiskScore(): RiskCalculation | null {
  const history = getHistory();
  if (history.length === 0) return null;
  
  const latest = history[history.length - 1];
  return {
    overallScore: latest.overallScore || 0,
    riskLevel: latest.riskLevel || 'low',
    components: {
      memory: latest.memoryScore || 0,
      speech: latest.speechScore || 0,
      facial: latest.facialScore || 0,
    },
    trend: latest.trend || 'stable',
    confidence: latest.confidence || 100,
  };
}

export function getBaselineScore(): number {
  const history = getHistory();
  if (history.length < 3) return 50; // Default baseline
  
  // Use average of first 3 assessments as baseline
  const baseline = history.slice(0, 3);
  const sum = baseline.reduce((acc: number, curr: any) => acc + (curr.overallScore || 0), 0);
  return Math.round(sum / baseline.length);
}

export function getAssessmentHistory(): any[] {
  return getHistory();
}