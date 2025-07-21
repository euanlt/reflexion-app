"use client";

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Menu, Home, Calendar, Headphones, TrendingUp, AlertTriangle, CheckCircle, Brain, Heart, BarChart3, Users, Camera, Mic } from 'lucide-react';
import Link from 'next/link';
import { EmergencyNotificationSystem } from '@/components/emergency/EmergencyNotificationSystem';
import { PerformanceMonitor } from '@/components/performance/PerformanceMonitor';
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider';

// Mock user data - in real app this would come from assessment results
const USER_ASSESSMENT = {
  riskScore: 80, // Can be 10 (low), 50 (medium), 80 (high)
  riskLevel: 'High Risk',
  speakingPatterns: 80,
  face: 80,
  speechContent: 80,
  lastAssessment: '2 hours ago'
};

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
  const { announceToScreenReader } = useAccessibility();
  const riskConfig = getRiskConfig(USER_ASSESSMENT.riskScore);
  const IconComponent = riskConfig.icon;

  useEffect(() => {
    setIsLoaded(true);
    
    // Announce page load to screen readers
    announceToScreenReader(`Reflexion dashboard loaded. Current risk level: ${riskConfig.level}`);
    
    // Announce high-risk state
    if (USER_ASSESSMENT.riskScore >= 70) {
      announceToScreenReader('High risk assessment detected. Emergency contacts will be notified.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
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
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - USER_ASSESSMENT.riskScore / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${riskConfig.color}`}>{USER_ASSESSMENT.riskScore}</span>
              <span className={`text-lg font-medium ${riskConfig.color}`}>{riskConfig.level}</span>
            </div>
          </div>
        </div>

        {/* Assessment Metrics */}
        <div className={`space-y-4 mb-8 transform transition-all duration-1000 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Speaking Patterns</span>
            <span className="text-lg font-bold text-gray-900">{USER_ASSESSMENT.speakingPatterns}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${USER_ASSESSMENT.speakingPatterns}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Face</span>
            <span className="text-lg font-bold text-gray-900">{USER_ASSESSMENT.face}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${USER_ASSESSMENT.face}%` }}></div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-gray-900">Speech Content</span>
            <span className="text-lg font-bold text-gray-900">{USER_ASSESSMENT.speechContent}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className={`${riskConfig.progressColor} h-2 rounded-full`} style={{ width: `${USER_ASSESSMENT.speechContent}%` }}></div>
          </div>
        </div>

        {/* Risk Status Card */}
        <div className={`mb-8 transform transition-all duration-1000 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          {/* Emergency Notification System */}
          {USER_ASSESSMENT.riskScore >= 70 && (
            <div className="mb-6">
              <EmergencyNotificationSystem
                riskScore={USER_ASSESSMENT.riskScore}
                patientName="Helena"
                assessmentData={USER_ASSESSMENT}
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
            {USER_ASSESSMENT.riskScore >= 70 ? (
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
            <p className="text-lg font-bold text-gray-900">{USER_ASSESSMENT.lastAssessment}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <p className="text-sm text-gray-600">Overall Score</p>
            <p className={`text-lg font-bold ${riskConfig.color}`}>{USER_ASSESSMENT.riskScore}/100</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-around">
          <Link href="/" aria-label="Home">
            <Home className="w-6 h-6 text-gray-900" />
          </Link>
          <Link href="/daily-checkin" aria-label="Daily Check-in">
            <Calendar className="w-6 h-6 text-gray-400" />
          </Link>
          <Link href="/exercises" aria-label="Exercises">
            <Headphones className="w-6 h-6 text-gray-400" />
          </Link>
        </div>
      </div>
      
      <PerformanceMonitor />
    </div>
  );
}