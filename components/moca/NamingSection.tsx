import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

interface NamingSectionProps {
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

const ANIMALS = [
  {
    name: 'Lion',
    image: 'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&h=400&fit=crop',
    acceptableAnswers: ['lion', 'lions']
  },
  {
    name: 'Rhinoceros',
    image: 'https://images.unsplash.com/photo-1598894000396-bc30e0996899?w=400&h=400&fit=crop',
    acceptableAnswers: ['rhinoceros', 'rhino', 'rhinos']
  },
  {
    name: 'Camel',
    image: 'https://images.unsplash.com/photo-1565992302843-173d58b87c48?w=400&h=400&fit=crop',
    acceptableAnswers: ['camel', 'camels', 'dromedary']
  }
];

export function NamingSection({ onComplete, onNavigate }: NamingSectionProps) {
  const [currentAnimal, setCurrentAnimal] = useState(0);
  const [responses, setResponses] = useState<(boolean | null)[]>([null, null, null]);
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Check if all animals have been shown
    if (responses.every(r => r !== null)) {
      const score = responses.filter(r => r === true).length;
      setIsComplete(true);
      onComplete(score);
    }
  }, [responses, onComplete]);

  const handleSubmit = () => {
    const animal = ANIMALS[currentAnimal];
    const isCorrect = animal.acceptableAnswers.some(
      answer => userAnswer.toLowerCase().trim() === answer.toLowerCase()
    );
    
    const newResponses = [...responses];
    newResponses[currentAnimal] = isCorrect;
    setResponses(newResponses);
    setShowResult(true);

    // Auto-advance after showing result
    setTimeout(() => {
      if (currentAnimal < ANIMALS.length - 1) {
        setCurrentAnimal(currentAnimal + 1);
        setUserAnswer('');
        setShowResult(false);
      }
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      handleSubmit();
    }
  };

  if (isComplete) {
    const score = responses.filter(r => r === true).length;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Naming - Complete
        </h2>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {score}/3
              </p>
              <p className="text-green-700">
                You correctly identified {score} out of 3 animals.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="space-y-3">
          {ANIMALS.map((animal, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full ${
                responses[index] ? 'bg-green-600' : 'bg-red-600'
              }`}>
                {responses[index] ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <XCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-gray-700">{animal.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const animal = ANIMALS[currentAnimal];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Naming
        </h2>
        <p className="text-gray-600">
          Please identify the animal shown in the image below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            Animal {currentAnimal + 1} of {ANIMALS.length}
          </p>
          <Card className="overflow-hidden mx-auto" style={{ maxWidth: '400px' }}>
            <img 
              src={animal.image} 
              alt="Animal to identify"
              className="w-full h-64 object-cover"
            />
          </Card>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label htmlFor="animal-name" className="block text-sm font-medium text-gray-700 mb-2">
              What animal is this?
            </label>
            <input
              id="animal-name"
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Type your answer here"
              disabled={showResult}
              autoFocus
            />
          </div>

          {showResult && (
            <Card className={`p-4 ${
              responses[currentAnimal] ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {responses[currentAnimal] ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700 font-medium">
                      Incorrect. The answer is: {animal.name}
                    </span>
                  </>
                )}
              </div>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || showResult}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Submit Answer
          </Button>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="flex justify-center gap-2 mt-6">
        {ANIMALS.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentAnimal
                ? 'bg-blue-600'
                : responses[index] !== null
                ? 'bg-gray-400'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}