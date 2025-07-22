"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Timer, Brain, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NamingSection } from '@/components/moca/NamingSection';
import { OrientationSection } from '@/components/moca/OrientationSection';
import { MemoryImmediateSection } from '@/components/moca/MemoryImmediateSection';
import { MemoryDelayedSection } from '@/components/moca/MemoryDelayedSection';
import { AbstractionSection } from '@/components/moca/AbstractionSection';
import { LanguageSection } from '@/components/moca/LanguageSection';
import { AssessmentStorage } from '@/lib/assessment-storage';

// MoCA test sections
export type MocaSection = 
  | 'introduction'
  | 'visuospatial'
  | 'naming'
  | 'memory-immediate'
  | 'attention'
  | 'language'
  | 'abstraction'
  | 'memory-delayed'
  | 'orientation'
  | 'results';

interface MocaTestState {
  currentSection: MocaSection;
  scores: {
    visuospatial: number;
    naming: number;
    attention: number;
    language: number;
    abstraction: number;
    memoryDelayed: number;
    orientation: number;
  };
  memoryWords: string[];
  startTime: number;
  sectionStartTime: number;
  totalElapsedTime: number;
}

const SECTION_ORDER: MocaSection[] = [
  'introduction',
  'visuospatial',
  'naming',
  'memory-immediate',
  'attention',
  'language',
  'abstraction',
  'memory-delayed',
  'orientation',
  'results'
];

const SECTION_NAMES: Record<MocaSection, string> = {
  introduction: 'Introduction',
  visuospatial: 'Visuospatial/Executive',
  naming: 'Naming',
  'memory-immediate': 'Memory (Learning)',
  attention: 'Attention',
  language: 'Language',
  abstraction: 'Abstraction',
  'memory-delayed': 'Memory (Recall)',
  orientation: 'Orientation',
  results: 'Results'
};

export default function MocaTestPage() {
  const router = useRouter();
  const [testState, setTestState] = useState<MocaTestState>({
    currentSection: 'introduction',
    scores: {
      visuospatial: 0,
      naming: 0,
      attention: 0,
      language: 0,
      abstraction: 0,
      memoryDelayed: 0,
      orientation: 0
    },
    memoryWords: [],
    startTime: Date.now(),
    sectionStartTime: Date.now(),
    totalElapsedTime: 0
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [hasShownResults, setHasShownResults] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setIsLoaded(true);
    
    // Update timer every second
    timerRef.current = setInterval(() => {
      setTestState(prev => ({
        ...prev,
        totalElapsedTime: Math.floor((Date.now() - prev.startTime) / 1000)
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Save results when reaching the results section
  useEffect(() => {
    if (testState.currentSection === 'results' && !hasShownResults) {
      setHasShownResults(true);
      const totalScore = getTotalScore();
      const isNormal = totalScore >= 26;
      
      const saveResults = async () => {
        try {
          const assessment = {
            date: new Date().toISOString(),
            results: [{
              taskType: 'moca' as const,
              score: totalScore,
              data: {
                scores: testState.scores,
                breakdown: {
                  visuospatial: testState.scores.visuospatial,
                  naming: testState.scores.naming,
                  attention: testState.scores.attention,
                  language: testState.scores.language,
                  abstraction: testState.scores.abstraction,
                  memoryDelayed: testState.scores.memoryDelayed,
                  orientation: testState.scores.orientation
                },
                isNormal,
                totalPossible: 30
              },
              timestamp: new Date().toISOString(),
              duration: testState.totalElapsedTime
            }],
            overallScore: Math.round((totalScore / 30) * 100), // Convert to percentage
            riskLevel: isNormal ? 'low' : 'medium' as 'low' | 'medium' | 'high',
            duration: testState.totalElapsedTime,
            completedAt: new Date().toISOString()
          };
          
          await AssessmentStorage.saveAssessment(assessment);
        } catch (error) {
          console.error('Failed to save MoCA results:', error);
        }
      };
      
      saveResults();
    }
  }, [testState.currentSection, hasShownResults, testState.scores, testState.totalElapsedTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSectionIndex = () => {
    return SECTION_ORDER.indexOf(testState.currentSection);
  };

  const getProgress = () => {
    const currentIndex = getCurrentSectionIndex();
    return Math.round((currentIndex / (SECTION_ORDER.length - 1)) * 100);
  };

  const navigateToSection = (direction: 'next' | 'previous') => {
    const currentIndex = getCurrentSectionIndex();
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (newIndex >= 0 && newIndex < SECTION_ORDER.length) {
      setTestState(prev => ({
        ...prev,
        currentSection: SECTION_ORDER[newIndex],
        sectionStartTime: Date.now()
      }));
    }
  };

  const updateScore = (category: keyof typeof testState.scores, points: number) => {
    setTestState(prev => ({
      ...prev,
      scores: {
        ...prev.scores,
        [category]: points
      }
    }));
  };

  const getTotalScore = () => {
    return Object.values(testState.scores).reduce((sum, score) => sum + score, 0);
  };

  const renderSection = () => {
    switch (testState.currentSection) {
      case 'introduction':
        return (
          <div className="space-y-6 text-center">
            <Brain className="w-20 h-20 text-blue-600 mx-auto" />
            <h2 className="text-3xl font-bold text-gray-900">
              Montreal Cognitive Assessment (MoCA)
            </h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              This test will help assess various cognitive functions including memory, attention, 
              language, and more. The test takes approximately 10 minutes to complete.
            </p>
            <div className="bg-blue-50 p-6 rounded-xl max-w-xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">Instructions:</h3>
              <ul className="text-left text-blue-800 space-y-2">
                <li>• Find a quiet, comfortable place</li>
                <li>• Have a pen and paper ready for some tasks</li>
                <li>• Follow the instructions carefully</li>
                <li>• Take your time, but work steadily</li>
              </ul>
            </div>
            <Button
              onClick={() => navigateToSection('next')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Start Assessment
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        );

      case 'visuospatial':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Visuospatial and Executive Functions
            </h2>
            <p className="text-gray-700">
              This section is under development. It will include:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Trail Making Test (connecting numbers and letters)</li>
              <li>Cube Copy Drawing</li>
              <li>Clock Drawing Test</li>
            </ul>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-yellow-800">
                For now, please proceed to the next section.
              </p>
            </div>
          </div>
        );

      case 'results':
        const totalScore = getTotalScore();
        const isNormal = totalScore >= 26;
        
        return (
          <div className="space-y-6 text-center">
            <div className="mb-8">
              {isNormal ? (
                <CheckCircle2 className="w-20 h-20 text-green-600 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-20 h-20 text-yellow-600 mx-auto mb-4" />
              )}
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Complete
              </h2>
              <p className="text-xl text-gray-700">
                Total Score: <span className="font-bold">{totalScore}/30</span>
              </p>
              <p className={`text-lg mt-2 ${isNormal ? 'text-green-600' : 'text-yellow-600'}`}>
                {isNormal ? 'Within Normal Range' : 'Below Normal Range'}
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl max-w-2xl mx-auto">
              <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown:</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span>Visuospatial/Executive:</span>
                  <span className="font-medium">{testState.scores.visuospatial}/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Naming:</span>
                  <span className="font-medium">{testState.scores.naming}/3</span>
                </div>
                <div className="flex justify-between">
                  <span>Attention:</span>
                  <span className="font-medium">{testState.scores.attention}/6</span>
                </div>
                <div className="flex justify-between">
                  <span>Language:</span>
                  <span className="font-medium">{testState.scores.language}/3</span>
                </div>
                <div className="flex justify-between">
                  <span>Abstraction:</span>
                  <span className="font-medium">{testState.scores.abstraction}/2</span>
                </div>
                <div className="flex justify-between">
                  <span>Delayed Recall:</span>
                  <span className="font-medium">{testState.scores.memoryDelayed}/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <span className="font-medium">{testState.scores.orientation}/6</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link href="/assessment-history">
                <Button variant="outline" className="px-6 py-3">
                  View History
                </Button>
              </Link>
              <Link href="/">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
                  Return Home
                </Button>
              </Link>
            </div>
          </div>
        );

      case 'naming':
        return (
          <NamingSection
            onComplete={(score) => updateScore('naming', score)}
            onNavigate={navigateToSection}
          />
        );

      case 'memory-immediate':
        return (
          <MemoryImmediateSection
            onComplete={(words) => {
              setTestState(prev => ({ ...prev, memoryWords: words }));
              navigateToSection('next');
            }}
            onNavigate={navigateToSection}
          />
        );

      case 'memory-delayed':
        return (
          <MemoryDelayedSection
            memoryWords={testState.memoryWords}
            onComplete={(score) => updateScore('memoryDelayed', score)}
            onNavigate={navigateToSection}
          />
        );

      case 'language':
        return (
          <LanguageSection
            onComplete={(score) => updateScore('language', score)}
            onNavigate={navigateToSection}
          />
        );

      case 'abstraction':
        return (
          <AbstractionSection
            onComplete={(score) => updateScore('abstraction', score)}
            onNavigate={navigateToSection}
          />
        );

      case 'orientation':
        return (
          <OrientationSection
            onComplete={(score) => updateScore('orientation', score)}
            onNavigate={navigateToSection}
          />
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {SECTION_NAMES[testState.currentSection]}
            </h2>
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <p className="text-gray-600">
                This section is under development.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/daily-checkin" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">MoCA Test</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <Timer className="w-5 h-5" />
              <span className="font-medium">{formatTime(testState.totalElapsedTime)}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          {testState.currentSection !== 'introduction' && testState.currentSection !== 'results' && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{SECTION_NAMES[testState.currentSection]}</span>
                <span>{getProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className={`p-8 bg-white shadow-lg transform transition-all duration-500 ${
          isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          {renderSection()}
          
          {/* Navigation buttons */}
          {testState.currentSection !== 'introduction' && testState.currentSection !== 'results' && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => navigateToSection('previous')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                onClick={() => navigateToSection('next')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}