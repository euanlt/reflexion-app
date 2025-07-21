"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { FaceDetection } from '@/components/ai/FaceDetection';
import { SpeechAnalysis } from '@/components/ai/SpeechAnalysis';
import { MemoryTask } from '@/components/tasks/MemoryTask';
import { EmotionExercise } from '@/components/tasks/EmotionExercise';
import { saveAssessmentWithRiskCalculation, AssessmentResult } from '@/lib/risk-calculation';
import { useRouter } from 'next/navigation';

const TASKS = [
  { id: 'memory', title: 'Memory Exercise', component: MemoryTask },
  { id: 'emotion', title: 'Facial Expression', component: EmotionExercise },
  { id: 'speech', title: 'Voice Activity', component: SpeechAnalysis },
];

export default function DailyCheckinPage() {
  const [currentTask, setCurrentTask] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [assessmentData, setAssessmentData] = useState<Partial<AssessmentResult>>({});
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const progress = ((currentTask + 1) / TASKS.length) * 100;
  const CurrentComponent = TASKS[currentTask]?.component;

  const handleTaskComplete = async (taskId: string, data: any) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
      
      // Store assessment data based on task type
      if (taskId === 'memory') {
        setAssessmentData(prev => ({ ...prev, memoryScore: data.score || 0 }));
      } else if (taskId === 'emotion') {
        setAssessmentData(prev => ({ ...prev, facialScore: data.score || 0 }));
      } else if (taskId === 'speech') {
        setAssessmentData(prev => ({ ...prev, speechScore: data.score || 0 }));
      }
    }
  };

  const handleNext = () => {
    if (currentTask < TASKS.length - 1) {
      setCurrentTask(currentTask + 1);
    }
  };

  const handlePrevious = () => {
    if (currentTask > 0) {
      setCurrentTask(currentTask - 1);
    }
  };

  const isAllComplete = completedTasks.length === TASKS.length;

  // Save assessment when all tasks are complete
  useEffect(() => {
    const saveAssessment = async () => {
      if (isAllComplete && !isSaving && assessmentData.memoryScore !== undefined && 
          assessmentData.speechScore !== undefined && assessmentData.facialScore !== undefined) {
        setIsSaving(true);
        try {
          const fullAssessment: AssessmentResult = {
            memoryScore: assessmentData.memoryScore,
            speechScore: assessmentData.speechScore,
            facialScore: assessmentData.facialScore,
            timestamp: new Date(),
          };
          
          const riskCalculation = await saveAssessmentWithRiskCalculation(fullAssessment);
          
          // Check if high risk and redirect accordingly
          if (riskCalculation.riskLevel === 'high') {
            router.push('/emergency-alert');
          }
        } catch (error) {
          console.error('Error saving assessment:', error);
        }
      }
    };
    
    saveAssessment();
  }, [isAllComplete, assessmentData, isSaving, router]);

  if (!isStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-primary mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-senior-base">Back to Home</span>
          </Link>

          <Card className="senior-card gradient-primary text-white">
            <div className="text-center">
              <h1 className="text-senior-xl font-bold mb-4">
                Daily Check-in
              </h1>
              <p className="text-senior-base mb-6 opacity-90">
                We'll do three quick activities together. Each one takes about 2-3 minutes.
              </p>
              
              <div className="space-y-3 mb-6 text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span>Memory exercise with pictures</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span>Facial expression practice</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span>Voice and mood check</span>
                </div>
              </div>

              <Button 
                onClick={() => setIsStarted(true)}
                className="senior-button bg-white text-primary hover:bg-gray-50"
                size="lg"
              >
                Let's Begin
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isAllComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-lg">
        <Card className="senior-card gradient-success text-white text-center">
          <CheckCircle className="w-24 h-24 mx-auto mb-6 animate-bounce-soft" />
          <h1 className="text-senior-xl font-bold mb-4">
            Great Job Today!
          </h1>
          <p className="text-senior-base mb-6 opacity-90">
            You've completed all your daily activities. Your progress has been saved.
          </p>
          
          <div className="space-y-4">
            <Link href="/dashboard">
              <Button className="senior-button bg-white text-green-700 hover:bg-gray-50 w-full mb-3">
                View My Progress
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="senior-button border-white text-white hover:bg-white hover:text-green-700 w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={handlePrevious}
          disabled={currentTask === 0}
          className="senior-button h-auto p-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        
        <div className="text-center flex-1">
          <p className="text-senior-base text-gray-600 mb-2">
            Activity {currentTask + 1} of {TASKS.length}
          </p>
          <Progress value={progress} className="w-full h-3" />
        </div>

        <Button
          variant="ghost"
          onClick={handleNext}
          disabled={currentTask === TASKS.length - 1}
          className="senior-button h-auto p-3"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Current Task */}
      <div className="mb-6">
        <h1 className="text-senior-xl font-bold text-center mb-8">
          {TASKS[currentTask].title}
        </h1>
        
        {CurrentComponent && (
          <CurrentComponent
            onComplete={(data: any) => handleTaskComplete(TASKS[currentTask].id, data)}
            isCompleted={completedTasks.includes(TASKS[currentTask].id)}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex space-x-4">
        {currentTask > 0 && (
          <Button
            variant="outline"
            onClick={handlePrevious}
            className="senior-button flex-1"
          >
            Previous
          </Button>
        )}
        
        {currentTask < TASKS.length - 1 ? (
          <Button
            onClick={handleNext}
            disabled={!completedTasks.includes(TASKS[currentTask].id)}
            className="senior-button flex-1"
          >
            Next Activity
          </Button>
        ) : (
          <Button 
            onClick={() => {
              if (completedTasks.includes(TASKS[currentTask].id)) {
                // This will trigger the useEffect to save assessment
                setCurrentTask(TASKS.length);
              }
            }}
            disabled={!completedTasks.includes(TASKS[currentTask].id)}
            className="senior-button flex-1 gradient-success border-0"
          >
            Complete Check-in
          </Button>
        )}
      </div>
    </div>
  );
}