"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MocaSectionConfig {
  sectionName: string;
  sectionId: string;
  maxScore: number;
  instructions?: string;
  tasks: Task[];
  showProgressIndicators?: boolean;
  completionMessage: (score: number, maxScore: number) => string;
}

export interface Task {
  id: string;
  type: 'question' | 'activity' | 'timed' | 'interactive';
  data: any;
}

export interface ContentRenderProps<T = any> {
  currentIndex: number;
  responses: T[];
  isComplete: boolean;
  handleSubmit: (response: T) => void;
  customState: any;
  updateCustomState: (state: any) => void;
  showInstructions: boolean;
  handleInstructionsComplete: () => void;
}

interface MocaSectionProps<T = any> {
  config: MocaSectionConfig;
  onComplete: (result: any) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
  renderContent: (props: ContentRenderProps<T>) => React.ReactNode;
  validateResponse?: (response: T, task: Task) => boolean | number;
  customState?: any;
  renderResults?: (responses: T[], scores: Record<string, boolean | number>) => React.ReactNode;
  skipInstructions?: boolean;
}

export function MocaSection<T = any>({
  config,
  onComplete,
  onNavigate,
  renderContent,
  validateResponse,
  customState: initialCustomState = {},
  renderResults,
  skipInstructions = false
}: MocaSectionProps<T>) {
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<T[]>([]);
  const [scores, setScores] = useState<Record<string, boolean | number>>({});
  const [customState, setCustomState] = useState(initialCustomState);
  const [showInstructions, setShowInstructions] = useState(!skipInstructions && !!config.instructions);

  const handleSubmit = (response: T) => {
    const taskId = config.tasks[currentIndex].id;
    const score = validateResponse ? validateResponse(response, config.tasks[currentIndex]) : true;
    
    setResponses([...responses, response]);
    setScores({ ...scores, [taskId]: score });

    if (currentIndex < config.tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Calculate total score
      const totalScore = Object.values({ ...scores, [taskId]: score }).reduce((sum: number, val) => {
        if (typeof val === 'number') return sum + val;
        return sum + (val ? 1 : 0);
      }, 0);
      
      setIsComplete(true);
      onComplete(totalScore);
    }
  };

  const handleInstructionsComplete = () => {
    setShowInstructions(false);
  };

  const calculateScore = () => {
    return Object.values(scores).reduce((sum: number, val) => {
      if (typeof val === 'number') return sum + val;
      return sum + (val ? 1 : 0);
    }, 0);
  };

  if (isComplete) {
    const totalScore = calculateScore();
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {config.sectionName} - Complete
        </h2>
        
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {totalScore}/{config.maxScore}
              </p>
              <p className="text-green-700">
                {config.completionMessage(totalScore as number, config.maxScore)}
              </p>
            </div>
          </div>
        </Card>

        {renderResults && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Results</h3>
            {renderResults(responses, scores)}
          </Card>
        )}

        <Button
          onClick={() => onNavigate('next')}
          className="w-full"
          size="lg"
        >
          Continue to Next Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{config.sectionName}</h2>
      
      {renderContent({
        currentIndex,
        responses,
        isComplete,
        handleSubmit,
        customState,
        updateCustomState: setCustomState,
        showInstructions,
        handleInstructionsComplete
      })}

      {config.showProgressIndicators && config.tasks.length > 1 && !showInstructions && (
        <div className="flex justify-center gap-2 mt-6">
          {config.tasks.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex
                  ? 'bg-blue-600'
                  : index < currentIndex
                  ? 'bg-gray-400'
                  : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Common UI Components for sections to use

export function InstructionsCard({ 
  instructions, 
  onContinue 
}: { 
  instructions: string; 
  onContinue: () => void;
}) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Instructions</h3>
      <p className="text-gray-700 mb-6">{instructions}</p>
      <Button onClick={onContinue} className="w-full">
        Start
      </Button>
    </Card>
  );
}

export function ScoreIcon({ isCorrect }: { isCorrect: boolean }) {
  return isCorrect ? (
    <CheckCircle2 className="w-5 h-5 text-green-600" />
  ) : (
    <XCircle className="w-5 h-5 text-red-600" />
  );
}