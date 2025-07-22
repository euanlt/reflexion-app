import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';

interface MemoryDelayedSectionProps {
  memoryWords: string[];
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

export function MemoryDelayedSection({ memoryWords, onComplete, onNavigate }: MemoryDelayedSectionProps) {
  const [userWords, setUserWords] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  const handleAddWord = () => {
    if (currentInput.trim() && userWords.length < 5) {
      setUserWords([...userWords, currentInput.trim().toUpperCase()]);
      setCurrentInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentInput.trim()) {
      handleAddWord();
    }
  };

  const handleComplete = () => {
    // Calculate score: 1 point for each correctly recalled word
    const correctWords = userWords.filter(word => 
      memoryWords.includes(word.toUpperCase())
    );
    const score = correctWords.length;
    setIsComplete(true);
    onComplete(score);
  };

  const getHint = () => {
    if (hintsUsed < 3) {
      setShowHint(true);
      setHintsUsed(hintsUsed + 1);
      setTimeout(() => setShowHint(false), 5000);
    }
  };

  const getHintMessage = () => {
    const categories = {
      'FACE': 'body part',
      'FINGER': 'body part',
      'NOSE': 'body part',
      'VELVET': 'fabric',
      'COTTON': 'fabric',
      'SILK': 'fabric',
      'CHURCH': 'building',
      'SCHOOL': 'building',
      'TEMPLE': 'building',
      'DAISY': 'flower',
      'TULIP': 'flower',
      'ROSE': 'flower',
      'RED': 'color',
      'BLUE': 'color',
      'GREEN': 'color'
    };

    const unrecalledWords = memoryWords.filter(word => 
      !userWords.includes(word.toUpperCase())
    );

    if (unrecalledWords.length > 0) {
      const hintWord = unrecalledWords[0];
      return `Hint: One word was a ${categories[hintWord] || 'word'}`;
    }
    return '';
  };

  if (isComplete) {
    const correctWords = userWords.filter(word => 
      memoryWords.includes(word.toUpperCase())
    );
    const incorrectWords = userWords.filter(word => 
      !memoryWords.includes(word.toUpperCase())
    );
    const missedWords = memoryWords.filter(word => 
      !userWords.includes(word.toUpperCase())
    );

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Memory - Delayed Recall Complete
        </h2>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {correctWords.length}/5
              </p>
              <p className="text-green-700">
                You correctly recalled {correctWords.length} out of 5 words.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="space-y-4">
          {correctWords.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Correctly Recalled:</h4>
              <div className="flex flex-wrap gap-2">
                {correctWords.map((word, index) => (
                  <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {incorrectWords.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Incorrect Words:</h4>
              <div className="flex flex-wrap gap-2">
                {incorrectWords.map((word, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {missedWords.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Words Not Recalled:</h4>
              <div className="flex flex-wrap gap-2">
                {missedWords.map((word, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Memory - Delayed Recall
        </h2>
        <p className="text-gray-600">
          Can you recall the 5 words that were read to you earlier? 
          Enter them one at a time in any order.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Recall the Words
            </h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter a word you remember"
                disabled={userWords.length >= 5}
              />
              <Button
                onClick={handleAddWord}
                disabled={!currentInput.trim() || userWords.length >= 5}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Word
              </Button>
            </div>
            
            {showHint && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">{getHintMessage()}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Words recalled: {userWords.length}/5
                </p>
                {hintsUsed < 3 && userWords.length < 5 && (
                  <Button
                    onClick={getHint}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Get Hint ({3 - hintsUsed} left)
                  </Button>
                )}
              </div>
              
              {userWords.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                  {userWords.map((word, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                        {word}
                      </span>
                      <button
                        onClick={() => setUserWords(userWords.filter((_, i) => i !== index))}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="pt-4">
            <Button
              onClick={handleComplete}
              disabled={userWords.length === 0}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {userWords.length === 5 ? 'Submit All Words' : `Submit ${userWords.length} Word${userWords.length !== 1 ? 's' : ''}`}
            </Button>
            
            {userWords.length < 5 && userWords.length > 0 && (
              <p className="text-sm text-gray-500 text-center mt-2">
                You can submit even if you can't remember all 5 words
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}