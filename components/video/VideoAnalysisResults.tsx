'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Activity, 
  Brain, 
  Eye, 
  AlertCircle, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'

export interface MovementAnalysis {
  coordinationScore: number
  balanceScore: number
  speedScore: number
  rangeOfMotion: number
  smoothness: number
  symmetry: number
  tremor: 'none' | 'mild' | 'moderate' | 'severe'
  abnormalMovements: string[]
}

export interface FacialAnalysis {
  expressionSymmetry: number
  eyeTracking: number
  blinkRate: number
  facialTone: 'normal' | 'reduced' | 'increased'
  emotionalExpression: 'appropriate' | 'flat' | 'exaggerated'
}

export interface PostureAnalysis {
  alignment: number
  stability: number
  headPosition: 'normal' | 'forward' | 'tilted'
  shoulderLevel: 'even' | 'uneven'
  trunkPosition: 'upright' | 'leaning' | 'slouched'
}

export interface VideoAnalysisResults {
  movement: MovementAnalysis
  facial: FacialAnalysis
  posture: PostureAnalysis
  overallScore: number
  riskLevel: 'low' | 'moderate' | 'high'
  recommendations: string[]
  timestamp: string
}

interface VideoAnalysisResultsProps {
  results: VideoAnalysisResults
  showDetails?: boolean
}

export function VideoAnalysisResults({ results, showDetails = true }: VideoAnalysisResultsProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600'
      case 'moderate': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (score >= 60) return <Minus className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Video Analysis Results
            </span>
            <Badge variant={results.riskLevel === 'low' ? 'default' : results.riskLevel === 'moderate' ? 'secondary' : 'destructive'}>
              {results.riskLevel.toUpperCase()} RISK
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                <span className={getScoreColor(results.overallScore)}>
                  {results.overallScore}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Overall Assessment Score</p>
            </div>

            {showDetails && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Movement Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Coordination</span>
                          <span className={getScoreColor(results.movement.coordinationScore)}>
                            {results.movement.coordinationScore}%
                          </span>
                        </div>
                        <Progress value={results.movement.coordinationScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Balance</span>
                          <span className={getScoreColor(results.movement.balanceScore)}>
                            {results.movement.balanceScore}%
                          </span>
                        </div>
                        <Progress value={results.movement.balanceScore} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Range of Motion</span>
                          <span className={getScoreColor(results.movement.rangeOfMotion)}>
                            {results.movement.rangeOfMotion}%
                          </span>
                        </div>
                        <Progress value={results.movement.rangeOfMotion} className="h-2" />
                      </div>
                      {results.movement.tremor !== 'none' && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {results.movement.tremor} tremor detected
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Facial Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Expression Symmetry</span>
                          <span className={getScoreColor(results.facial.expressionSymmetry)}>
                            {results.facial.expressionSymmetry}%
                          </span>
                        </div>
                        <Progress value={results.facial.expressionSymmetry} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Eye Tracking</span>
                          <span className={getScoreColor(results.facial.eyeTracking)}>
                            {results.facial.eyeTracking}%
                          </span>
                        </div>
                        <Progress value={results.facial.eyeTracking} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Facial Tone</span>
                          <Badge variant="outline" className="text-xs">
                            {results.facial.facialTone}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Expression</span>
                          <Badge variant="outline" className="text-xs">
                            {results.facial.emotionalExpression}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Posture Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Alignment</span>
                          <span className={getScoreColor(results.posture.alignment)}>
                            {results.posture.alignment}%
                          </span>
                        </div>
                        <Progress value={results.posture.alignment} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Stability</span>
                          <span className={getScoreColor(results.posture.stability)}>
                            {results.posture.stability}%
                          </span>
                        </div>
                        <Progress value={results.posture.stability} className="h-2" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Head Position</span>
                          <Badge variant="outline" className="text-xs">
                            {results.posture.headPosition}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Trunk</span>
                          <Badge variant="outline" className="text-xs">
                            {results.posture.trunkPosition}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {results.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {results.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Analysis performed on {new Date(results.timestamp).toLocaleString()}
              </p>
              {getTrendIcon(results.overallScore)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Example mock analysis generator for demonstration
export function generateMockAnalysis(): VideoAnalysisResults {
  const movement: MovementAnalysis = {
    coordinationScore: Math.floor(Math.random() * 30) + 70,
    balanceScore: Math.floor(Math.random() * 30) + 70,
    speedScore: Math.floor(Math.random() * 30) + 70,
    rangeOfMotion: Math.floor(Math.random() * 30) + 70,
    smoothness: Math.floor(Math.random() * 30) + 70,
    symmetry: Math.floor(Math.random() * 30) + 70,
    tremor: Math.random() > 0.7 ? 'mild' : 'none',
    abnormalMovements: Math.random() > 0.8 ? ['slight hesitation in left arm movement'] : []
  }

  const facial: FacialAnalysis = {
    expressionSymmetry: Math.floor(Math.random() * 20) + 80,
    eyeTracking: Math.floor(Math.random() * 20) + 80,
    blinkRate: Math.floor(Math.random() * 20) + 80,
    facialTone: 'normal',
    emotionalExpression: 'appropriate'
  }

  const posture: PostureAnalysis = {
    alignment: Math.floor(Math.random() * 20) + 80,
    stability: Math.floor(Math.random() * 20) + 80,
    headPosition: 'normal',
    shoulderLevel: 'even',
    trunkPosition: 'upright'
  }

  const scores = [
    movement.coordinationScore,
    movement.balanceScore,
    movement.rangeOfMotion,
    facial.expressionSymmetry,
    facial.eyeTracking,
    posture.alignment,
    posture.stability
  ]
  
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  
  let riskLevel: 'low' | 'moderate' | 'high' = 'low'
  if (overallScore < 70) riskLevel = 'high'
  else if (overallScore < 85) riskLevel = 'moderate'

  const recommendations = []
  if (movement.tremor !== 'none') {
    recommendations.push('Consider discussing the observed tremor with your healthcare provider')
  }
  if (movement.balanceScore < 80) {
    recommendations.push('Practice balance exercises daily to improve stability')
  }
  if (movement.rangeOfMotion < 80) {
    recommendations.push('Gentle stretching exercises may help improve range of motion')
  }
  if (facial.eyeTracking < 80) {
    recommendations.push('Eye tracking exercises could help improve visual coordination')
  }
  recommendations.push('Continue regular movement assessments to track progress')

  return {
    movement,
    facial,
    posture,
    overallScore,
    riskLevel,
    recommendations,
    timestamp: new Date().toISOString()
  }
}