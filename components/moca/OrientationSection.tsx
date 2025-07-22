import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Calendar, MapPin } from 'lucide-react';

interface OrientationSectionProps {
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

interface OrientationQuestion {
  id: string;
  question: string;
  type: 'date' | 'place';
  icon: React.ElementType;
  getCorrectAnswer: () => string;
  checkAnswer: (answer: string) => boolean;
}

export function OrientationSection({ onComplete, onNavigate }: OrientationSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);

  const questions: OrientationQuestion[] = [
    {
      id: 'date',
      question: 'What is today\'s date? (Day of the month)',
      type: 'date',
      icon: Calendar,
      getCorrectAnswer: () => new Date().getDate().toString(),
      checkAnswer: (answer) => {
        const userAnswer = parseInt(answer.trim());
        const correctDate = new Date().getDate();
        return userAnswer === correctDate;
      }
    },
    {
      id: 'month',
      question: 'What month is it?',
      type: 'date',
      icon: Calendar,
      getCorrectAnswer: () => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
        return months[new Date().getMonth()];
      },
      checkAnswer: (answer) => {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
        const currentMonth = months[new Date().getMonth()];
        return answer.toLowerCase().trim() === currentMonth;
      }
    },
    {
      id: 'year',
      question: 'What year is it?',
      type: 'date',
      icon: Calendar,
      getCorrectAnswer: () => new Date().getFullYear().toString(),
      checkAnswer: (answer) => {
        const userAnswer = parseInt(answer.trim());
        const correctYear = new Date().getFullYear();
        return userAnswer === correctYear;
      }
    },
    {
      id: 'day',
      question: 'What day of the week is it?',
      type: 'date',
      icon: Calendar,
      getCorrectAnswer: () => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
      },
      checkAnswer: (answer) => {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const currentDay = days[new Date().getDay()];
        return answer.toLowerCase().trim() === currentDay;
      }
    },
    {
      id: 'place',
      question: 'What type of place are you in right now? (e.g., home, office, hospital)',
      type: 'place',
      icon: MapPin,
      getCorrectAnswer: () => 'home', // This is subjective, we'll accept common answers
      checkAnswer: (answer) => {
        const validPlaces = ['home', 'house', 'apartment', 'office', 'hospital', 'clinic', 
                           'bedroom', 'living room', 'study', 'room'];
        return validPlaces.includes(answer.toLowerCase().trim());
      }
    },
    {
      id: 'city',
      question: 'What city are you in?',
      type: 'place',
      icon: MapPin,
      getCorrectAnswer: () => 'Your city', // This requires user to know their location
      checkAnswer: (answer) => {
        // For a real implementation, you might want to use geolocation or ask the user to set their city
        // For now, we'll accept any non-empty answer that looks like a city name
        const trimmedAnswer = answer.trim();
        return trimmedAnswer.length > 1 && /^[a-zA-Z\s\-\.]+$/.test(trimmedAnswer);
      }
    }
  ];

  useEffect(() => {
    if (Object.keys(scores).length === questions.length && !isComplete) {
      const totalScore = Object.values(scores).filter(Boolean).length;
      setIsComplete(true);
      onComplete(totalScore);
    }
  }, [scores, questions.length, onComplete, isComplete]);

  const handleSubmit = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = answers[currentQuestion.id] || '';
    const isCorrect = currentQuestion.checkAnswer(userAnswer);
    
    setScores(prev => ({
      ...prev,
      [currentQuestion.id]: isCorrect
    }));

    // Move to next question or complete
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && answers[questions[currentQuestionIndex].id]?.trim()) {
      handleSubmit();
    }
  };

  if (isComplete) {
    const totalScore = Object.values(scores).filter(Boolean).length;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Orientation - Complete
        </h2>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {totalScore}/6
              </p>
              <p className="text-green-700">
                You answered {totalScore} out of 6 orientation questions correctly.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="grid gap-3">
          {questions.map((question) => (
            <div key={question.id} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${
                scores[question.id] ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {scores[question.id] ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <XCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-gray-700 flex-1">{question.question}</span>
              {!scores[question.id] && question.type === 'date' && (
                <span className="text-sm text-gray-500">
                  Correct: {question.getCorrectAnswer()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const Icon = currentQuestion.icon;
  const hasAnsweredCurrent = scores.hasOwnProperty(currentQuestion.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Orientation
        </h2>
        <p className="text-gray-600">
          Please answer the following questions about time and place.
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Question {currentQuestionIndex + 1} of {questions.length}
          </p>
          
          <Card className="p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <Icon className="w-12 h-12 text-blue-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900">
                {currentQuestion.question}
              </h3>
              
              <div className="w-full max-w-md">
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
                  autoFocus
                />
              </div>

              {hasAnsweredCurrent && (
                <Card className={`w-full max-w-md p-4 ${
                  scores[currentQuestion.id] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-center gap-2">
                    {scores[currentQuestion.id] ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 font-medium">Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-700 font-medium">
                          Incorrect
                          {currentQuestion.type === 'date' && `. The answer is: ${currentQuestion.getCorrectAnswer()}`}
                        </span>
                      </>
                    )}
                  </div>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                disabled={!answers[currentQuestion.id]?.trim() || hasAnsweredCurrent}
                className="w-full max-w-md bg-blue-600 hover:bg-blue-700 text-white"
              >
                {hasAnsweredCurrent && currentQuestionIndex < questions.length - 1 
                  ? 'Next Question' 
                  : 'Submit Answer'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2">
          {questions.map((q, index) => (
            <div
              key={q.id}
              className={`w-2 h-2 rounded-full ${
                index === currentQuestionIndex
                  ? 'bg-blue-600'
                  : scores.hasOwnProperty(q.id)
                  ? 'bg-gray-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}