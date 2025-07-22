import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Volume2 } from 'lucide-react';

interface MemoryImmediateSectionProps {
  onComplete: (words: string[]) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

const WORD_LISTS = [
  ['FACE', 'VELVET', 'CHURCH', 'DAISY', 'RED'],
  ['FINGER', 'COTTON', 'SCHOOL', 'TULIP', 'BLUE'],
  ['NOSE', 'SILK', 'TEMPLE', 'ROSE', 'GREEN']
];

export function MemoryImmediateSection({ onComplete, onNavigate }: MemoryImmediateSectionProps) {
  const [currentTrial, setCurrentTrial] = useState(0);
  const [showWords, setShowWords] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  // Randomly select a word list
  const [selectedWords] = useState(() => 
    WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)]
  );

  useEffect(() => {
    if (showWords && wordIndex < selectedWords.length) {
      const timer = setTimeout(() => {
        // Use speech synthesis to read the word
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(selectedWords[wordIndex]);
          utterance.rate = 0.8;
          speechSynthesis.speak(utterance);
        }
        
        setWordIndex(wordIndex + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (showWords && wordIndex >= selectedWords.length) {
      // Finished showing all words
      setTimeout(() => {
        setShowWords(false);
        if (currentTrial === 0) {
          setCurrentTrial(1);
          setWordIndex(0);
        } else {
          setIsComplete(true);
        }
      }, 2000);
    }
  }, [showWords, wordIndex, selectedWords, currentTrial]);

  const startTrial = () => {
    setHasStarted(true);
    setShowWords(true);
    setWordIndex(0);
  };

  const handleComplete = () => {
    onComplete(selectedWords);
    onNavigate('next');
  };

  if (isComplete) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Memory - Learning Phase Complete
        </h2>
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-blue-900">
                Words presented successfully
              </p>
              <p className="text-blue-700">
                The 5 words have been read to you twice. You will be asked to recall them later in the test.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            <strong>Important:</strong> Try to remember these words as you will be asked to recall them later without any cues.
          </p>
        </div>
        
        <Button
          onClick={handleComplete}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          Continue to Next Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Memory - Word Learning
        </h2>
        <p className="text-gray-600">
          You will hear a list of 5 words. Listen carefully and try to remember them. 
          The words will be read to you twice.
        </p>
      </div>

      <Card className="p-8">
        {!hasStarted ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Volume2 className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to begin?
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Make sure your sound is on. The words will be read aloud one at a time.
              </p>
              
              <Button
                onClick={startTrial}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Listening
              </Button>
            </div>
          </div>
        ) : showWords ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center animate-pulse">
              <Volume2 className="w-10 h-10 text-blue-600" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Trial {currentTrial + 1} of 2
              </h3>
              
              {wordIndex < selectedWords.length ? (
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-blue-600 animate-fade-in">
                    {selectedWords[wordIndex]}
                  </p>
                  <p className="text-sm text-gray-500">
                    Word {wordIndex + 1} of {selectedWords.length}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">
                  Completing trial {currentTrial + 1}...
                </p>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((wordIndex + 1) / selectedWords.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Brain className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Trial {currentTrial} Complete
              </h3>
              <p className="text-gray-600">
                Ready for the second trial?
              </p>
              
              <Button
                onClick={() => {
                  setShowWords(true);
                  setWordIndex(0);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Trial 2
              </Button>
            </div>
          </div>
        )}
      </Card>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}