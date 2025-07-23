"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Menu, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { EmergencyNotificationSystem } from '@/components/emergency/EmergencyNotificationSystem';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';
import { getLatestRiskScore } from '@/lib/risk-calculation';
import { getAssessmentHistory } from '@/lib/assessment-storage';
import { AppShell } from '@/components/layout/AppShell';

const getRiskConfig = (score: number) => {
  if (score <= 30) {
    return {
      level: 'Low Risk',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      progressColor: 'bg-green-500',
      circleColor: '#10B981',
      icon: CheckCircle,
      message: 'Everything looks good! Why not keep it up with some daily cognitive exercises?'
    };
  } else if (score <= 70) {
    return {
      level: 'Medium Risk',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      progressColor: 'bg-yellow-500',
      circleColor: '#D97706',
      icon: AlertTriangle,
      message: 'Check out these cognitive games and lifestyle modifications!'
    };
  } else {
    return {
      level: 'High Risk',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      progressColor: 'bg-red-500',
      circleColor: '#DC2626',
      icon: AlertTriangle,
      message: 'Early diagnosis is key – check in with your caregivers or healthcare providers.'
    };
  }
};

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [assessmentData, setAssessmentData] = useState<any>(null);
  const { announceToScreenReader } = useAccessibility();
  
  // Get risk config based on actual or default data
  const riskScore = assessmentData?.overallScore || 0;
  const riskConfig = getRiskConfig(riskScore);
  const IconComponent = riskConfig.icon;

  useEffect(() => {
    setIsLoaded(true);
    loadAssessmentData();
  }, []);
  
  useEffect(() => {
    if (assessmentData) {
      // Announce page load to screen readers
      announceToScreenReader(`Reflexion dashboard loaded. Current risk level: ${riskConfig.level}`);
      
      // Announce high-risk state
      if (assessmentData.overallScore >= 70) {
        announceToScreenReader('High risk assessment detected. Emergency contacts will be notified.');
      }
    }
  }, [assessmentData, riskConfig.level]);
  
  const loadAssessmentData = () => {
    try {
      const latestScore = getLatestRiskScore();
      const history = getAssessmentHistory();
      
      if (latestScore) {
        // Get time of last assessment
        const lastAssessment = history.length > 0 ? history[history.length - 1] : null;
        const lastAssessmentTime = lastAssessment ? getRelativeTime(new Date(lastAssessment.date)) : 'No assessment yet';
        
        setAssessmentData({
          ...latestScore,
          speakingPatterns: latestScore.components.speech,
          face: latestScore.components.facial,
          speechContent: latestScore.components.memory,
          lastAssessment: lastAssessmentTime
        });
      }
    } catch (error) {
      console.error('Error loading assessment data:', error);
    }
  };
  
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Less than an hour ago';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white">
        <Menu className="w-6 h-6 text-gray-700" />
        <h1 className="text-xl font-semibold text-gray-900">Reflexion</h1>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img 
            src="https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="px-6 pb-24">
        {/* Risk Score Circle */}
        <div className={`text-center mb-8 transform transition-all duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#E5E7EB"
                strokeWidth="8"
                fill="none"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={riskConfig.circleColor}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - riskScore / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${riskConfig.color}`}>{riskScore}</span>
              <span className={`text-lg font-medium ${riskConfig.color}`}>{riskConfig.level}</span>
            </div>
          </div>
        </div>

        {/* Assessment Metrics */}
        <div className={`space-y-4 mb-8 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Speaking Patterns</span>
            <span className="text-lg font-bold text-gray-900">{assessmentData?.speakingPatterns || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${assessmentData?.speakingPatterns || 0}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Face</span>
            <span className="text-lg font-bold text-gray-900">{assessmentData?.face || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${assessmentData?.face || 0}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Speech Content</span>
            <span className="text-lg font-bold text-gray-900">{assessmentData?.speechContent || 0}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${assessmentData?.speechContent || 0}%` }}></div>
          </div>
        </div>

        {/* Risk Status Card */}
        <div className={`mb-8 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Emergency Notification System */}
          {riskScore >= 70 && (
            <div className="mb-6">
              <EmergencyNotificationSystem
                riskScore={riskScore}
                patientName="Helena"
                assessmentData={assessmentData || {}}
                onNotificationSent={(contact, method) => {
                  announceToScreenReader(`Emergency notification sent to ${contact.name} via ${method}`);
                }}
              />
            </div>
          )}
          
          <div className={`${riskConfig.bgColor} rounded-3xl p-6`}>
            <div className="flex items-center mb-3">
              <IconComponent className={`w-6 h-6 ${riskConfig.color} mr-3`} />
              <h3 className={`text-xl font-bold ${riskConfig.color.replace('text-', 'text-').replace('-600', '-800')}`}>
                Your current risk is {riskConfig.level.toLowerCase()}
              </h3>
            </div>
            <p className={`${riskConfig.color.replace('text-', 'text-').replace('-600', '-700')} mb-6`}>
              {riskConfig.message}
            </p>
            {riskScore >= 70 ? (
              <Button className={`w-full ${riskConfig.buttonColor} text-white font-semibold py-4 px-6 rounded-2xl text-lg mb-4`}>
                Call +65 xxxx for immediate assistance!
              </Button>
            ) : (
              <Link href="/exercises">
                <Button className={`w-full ${riskConfig.buttonColor} text-white font-semibold py-4 px-6 rounded-2xl text-lg`}>
                  Go to Exercises
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className={`grid grid-cols-2 gap-4 mb-8 transform transition-all duration-1000 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Last Assessment</p>
            <p className="text-lg font-bold text-gray-900">{assessmentData?.lastAssessment || 'No assessment yet'}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className={`text-lg font-bold ${riskConfig.color}`}>{riskScore}/100</p>
          </div>
        </div>
      </div>
      
      <PerformanceMonitor />
    </AppShell>
  );
}