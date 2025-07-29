"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import { MocaSection, MocaSectionConfig, Task, ContentRenderProps, ScoreIcon } from './MocaSection';

interface AbstractionSectionProps {
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

interface SimilarityQuestion {
  item1: string;
  item2: string;
  acceptableAnswers: string[];
  hint: string;
}

interface AbstractionResponse {
  answer: string;
  questionId: string;
}

const abstractionConfig: MocaSectionConfig = {
  sectionName: 'Abstraction',
  sectionId: 'abstraction',
  maxScore: 2,
  instructions: 'Tell me how these two items are similar or alike.',
  tasks: [
    {
      id: 'transport',
      type: 'question',
      data: {
        item1: 'train',
        item2: 'bicycle',
        acceptableAnswers: [
          'transportation', 'transport', 'vehicles', 'travel', 'means of transportation',
          'ways to travel', 'they move', 'movement', 'they take you places',
          'both are transportation', 'both are vehicles'
        ],
        hint: 'Think about what purpose they both serve'
      }
    },
    {
      id: 'measurement',
      type: 'question',
      data: {
        item1: 'watch',
        item2: 'ruler',
        acceptableAnswers: [
          'measurement', 'measuring', 'measure', 'measuring instruments', 'measuring tools',
          'instruments', 'tools', 'they measure', 'they measure things',
          'both measure', 'measurement devices'
        ],
        hint: 'Think about what they are used for'
      }
    }
  ],
  showProgressIndicators: true,
  completionMessage: (score, maxScore) => 
    `You correctly identified ${score} out of ${maxScore} similarities.`
};

export function AbstractionSectionRefactored({ onComplete, onNavigate }: AbstractionSectionProps) {
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const validateResponse = (response: AbstractionResponse, task: Task): boolean => {
    const question = task.data as SimilarityQuestion;
    const normalizedAnswer = response.answer.toLowerCase().trim();
    return question.acceptableAnswers.some(acceptable => 
      normalizedAnswer.includes(acceptable.toLowerCase())
    );
  };

  const renderContent = ({ 
    currentIndex, 
    handleSubmit, 
    responses,
    showInstructions,
    handleInstructionsComplete
  }: ContentRenderProps<AbstractionResponse>) => {
    if (showInstructions) {
      return (
        <Card className="p-6">
          <p className="text-gray-600 mb-4">{abstractionConfig.instructions}</p>
          <Button onClick={handleInstructionsComplete} className="w-full">
            Start
          </Button>
        </Card>
      );
    }

    const currentTask = abstractionConfig.tasks[currentIndex];
    const question = currentTask.data as SimilarityQuestion;
    const hasAnswered = responses.length > currentIndex;
    const isCorrect = hasAnswered && validateResponse(responses[currentIndex], currentTask);

    const handleAnswerSubmit = () => {
      handleSubmit({ answer: currentAnswer, questionId: currentTask.id });
      setHasSubmitted(true);
      
      // Reset for next question
      setTimeout(() => {
        setCurrentAnswer('');
        setHasSubmitted(false);
      }, 1500);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && currentAnswer.trim() && !hasSubmitted) {
        handleAnswerSubmit();
      }
    };

    return (
      <Card className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Question {currentIndex + 1} of {abstractionConfig.tasks.length}
            </p>
            
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                How are a <span className="text-blue-600">{question.item1}</span> and 
                a <span className="text-blue-600">{question.item2}</span> similar?
              </h3>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your answer here"
                  disabled={hasSubmitted}
                />
                
                {!hasSubmitted && (
                  <button
                    onClick={() => setShowHints(prev => ({ ...prev, [currentTask.id]: !prev[currentTask.id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {showHints[currentTask.id] && !hasSubmitted && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Hint:</strong> {question.hint}
                  </p>
                </div>
              )}
              
              {hasSubmitted && (
                <Card className={`p-4 ${
                  isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Correct!</span>
                      </>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-red-700 font-medium">Not quite right</span>
                        </div>
                        <p className="text-sm text-red-600">
                          Example answer: Both are {question.acceptableAnswers[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              <Button
                onClick={handleAnswerSubmit}
                disabled={!currentAnswer.trim() || hasSubmitted}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit Answer
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderResults = (responses: AbstractionResponse[], scores: Record<string, boolean | number>) => {
    return (
      <div className="space-y-3">
        {abstractionConfig.tasks.map((task, index) => {
          const question = task.data as SimilarityQuestion;
          const response = responses[index];
          const isCorrect = scores[task.id] as boolean;
          
          return (
            <div key={task.id} className="flex items-start gap-3">
              <ScoreIcon isCorrect={isCorrect} />
              <div className="flex-1">
                <p className="text-gray-700">
                  <span className="font-medium">{question.item1}</span> and{' '}
                  <span className="font-medium">{question.item2}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Your answer: {response?.answer || 'No answer'}
                </p>
                {!isCorrect && (
                  <p className="text-sm text-green-600 mt-1">
                    Example answer: {question.acceptableAnswers[0]}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <MocaSection
      config={abstractionConfig}
      onComplete={onComplete}
      onNavigate={onNavigate}
      renderContent={renderContent}
      validateResponse={validateResponse}
      renderResults={renderResults}
      customState={{ showHints, currentAnswer, hasSubmitted }}
    />
  );
}