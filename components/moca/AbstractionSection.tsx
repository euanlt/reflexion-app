import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

interface AbstractionSectionProps {
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

interface SimilarityQuestion {
  id: string;
  item1: string;
  item2: string;
  acceptableAnswers: string[];
  hint: string;
}

export function AbstractionSection({ onComplete, onNavigate }: AbstractionSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, boolean>>({});
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);

  const questions: SimilarityQuestion[] = [
    {
      id: 'transport',
      item1: 'train',
      item2: 'bicycle',
      acceptableAnswers: [
        'transportation', 'transport', 'vehicles', 'travel', 'means of transportation',
        'ways to travel', 'they move', 'movement', 'they take you places',
        'both are transportation', 'both are vehicles'
      ],
      hint: 'Think about what purpose they both serve'
    },
    {
      id: 'measurement',
      item1: 'watch',
      item2: 'ruler',
      acceptableAnswers: [
        'measurement', 'measuring', 'measure', 'measuring instruments', 'measuring tools',
        'instruments', 'tools', 'they measure', 'they measure things',
        'both measure', 'measurement devices'
      ],
      hint: 'Think about what they are used for'
    }
  ];

  useEffect(() => {
    if (Object.keys(scores).length === questions.length && !isComplete) {
      const totalScore = Object.values(scores).filter(Boolean).length;
      setIsComplete(true);
      onComplete(totalScore);
    }
  }, [scores, questions.length, onComplete, isComplete]);

  const checkAnswer = (questionId: string, userAnswer: string): boolean => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return false;
    
    const normalizedAnswer = userAnswer.toLowerCase().trim();
    return question.acceptableAnswers.some(acceptable => 
      normalizedAnswer.includes(acceptable.toLowerCase())
    );
  };

  const handleSubmit = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestion.id] || '';
    const isCorrect = checkAnswer(currentQuestion.id, userAnswer);
    
    setScores(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect
    }));

    // Move to next question if available
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 1500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answers[questions[currentQuestionIndex].id]?.trim()) {
      handleSubmit();
    }
  };

  const toggleHint = (questionId: string) => {
    setShowHint(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  if (isComplete) {
    const totalScore = Object.values(scores).filter(Boolean).length;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Abstraction - Complete
        </h2>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {totalScore}/2
              </p>
              <p className="text-green-700">
                You correctly identified {totalScore} out of 2 similarities.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full mt-0.5 ${
                scores[question.id] ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {scores[question.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <XCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-700">
                  <span className="font-medium">{question.item1}</span> and{' '}
                  <span className="font-medium">{question.item2}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Your answer: {answers[question.id] || 'No answer'}
                </p>
                {!scores[question.id] && (
                  <p className="text-sm text-green-600 mt-1">
                    Example answer: {question.acceptableAnswers[0]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const hasAnsweredCurrent = scores.hasOwnProperty(currentQuestion.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Abstraction
        </h2>
        <p className="text-gray-600">
          Tell me how these two items are similar or alike.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
            
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                How are a <span className="text-blue-600">{currentQuestion.item1}</span> and 
                a <span className="text-blue-600">{currentQuestion.item2}</span> similar?
              </h3>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    [currentQuestion.id]: e.target.value
                  }))}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Type your answer here"
                  disabled={hasAnsweredCurrent}
                />
                
                {!hasAnsweredCurrent && (
                  <button
                    onClick={() => toggleHint(currentQuestion.id)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {showHint[currentQuestion.id] && !hasAnsweredCurrent && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-700 text-sm">
                    <strong>Hint:</strong> {currentQuestion.hint}
                  </p>
                </div>
              )}
              
              {hasAnsweredCurrent && (
                <Card className={`p-4 ${
                  scores[currentQuestion.id] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {scores[currentQuestion.id] ? (
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
                          Example answer: Both are {currentQuestion.acceptableAnswers[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
              
              <Button
                onClick={handleSubmit}
                disabled={!answers[currentQuestion.id]?.trim() || hasAnsweredCurrent}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Submit Answer
              </Button>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600'
                    : scores.hasOwnProperty(questions[index].id)
                    ? 'bg-gray-400'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}