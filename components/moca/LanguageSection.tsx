import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Volume2, CheckCircle2, XCircle, Timer } from 'lucide-react';

interface LanguageSectionProps {
  onComplete: (score: number) => void;
  onNavigate: (direction: 'next' | 'previous') => void;
}

type RepetitionTask = 'repetition1' | 'repetition2';
type LanguageTask = RepetitionTask | 'fluency';

interface TaskResult {
  task: LanguageTask;
  score: number;
  userWords?: string[];
}

export function LanguageSection({ onComplete, onNavigate }: LanguageSectionProps) {
  const [currentTask, setCurrentTask] = useState<LanguageTask>('repetition1');
  const [results, setResults] = useState<TaskResult[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [fluencyWords, setFluencyWords] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [fluencyStarted, setFluencyStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const sentences: Record<RepetitionTask, string> = {
    repetition1: "I only know that John is the one to help today.",
    repetition2: "The cat always hid under the couch when dogs were in the room."
  };

  useEffect(() => {
    if (fluencyStarted && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && fluencyStarted) {
      completeFluencyTask();
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, fluencyStarted]);

  const playeSentence = (sentence: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  const handleRepetitionComplete = (task: LanguageTask, correct: boolean) => {
    const result: TaskResult = {
      task,
      score: correct ? 1 : 0
    };
    setResults([...results, result]);
    
    if (task === 'repetition1') {
      setCurrentTask('repetition2');
    } else {
      setCurrentTask('fluency');
    }
  };

  const startFluencyTask = () => {
    setFluencyStarted(true);
    setTimeLeft(60);
  };

  const addFluencyWord = () => {
    if (currentWord.trim() && currentWord.toLowerCase().startsWith('f')) {
      setFluencyWords([...fluencyWords, currentWord.trim()]);
      setCurrentWord('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentWord.trim()) {
      addFluencyWord();
    }
  };

  const completeFluencyTask = () => {
    // Score: 1 point if 11 or more words
    const fluencyScore = fluencyWords.length >= 11 ? 1 : 0;
    const result: TaskResult = {
      task: 'fluency',
      score: fluencyScore,
      userWords: fluencyWords
    };
    setResults([...results, result]);
    
    // Calculate total score
    const totalScore = [...results, result].reduce((sum, r) => sum + r.score, 0);
    setIsComplete(true);
    onComplete(totalScore);
  };

  if (isComplete) {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Language - Complete
        </h2>
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-lg font-semibold text-green-900">
                Score: {totalScore}/3
              </p>
              <p className="text-green-700">
                Language assessment completed.
              </p>
            </div>
          </div>
        </Card>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Sentence Repetition:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full ${
                  results.find(r => r.task === 'repetition1')?.score ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {results.find(r => r.task === 'repetition1')?.score ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-gray-700">First sentence</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full ${
                  results.find(r => r.task === 'repetition2')?.score ? 'bg-green-600' : 'bg-red-600'
                }`}>
                  {results.find(r => r.task === 'repetition2')?.score ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <XCircle className="w-5 h-5 text-white" />
                  )}
                </div>
                <span className="text-gray-700">Second sentence</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Letter Fluency (F):</h4>
            <p className="text-gray-700">
              Words named: {fluencyWords.length} 
              {results.find(r => r.task === 'fluency')?.score ? (
                <span className="text-green-600 ml-2">(≥11 words - 1 point)</span>
              ) : (
                <span className="text-red-600 ml-2">(&lt;11 words - 0 points)</span>
              )}
            </p>
            {fluencyWords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {fluencyWords.map((word, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Language
        </h2>
        <p className="text-gray-600">
          {currentTask.startsWith('repetition') 
            ? 'Listen carefully and repeat the sentence exactly as you hear it.'
            : 'Name as many words as you can that begin with the letter F.'}
        </p>
      </div>

      <Card className="p-6">
        {currentTask.startsWith('repetition') ? (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sentence Repetition - {currentTask === 'repetition1' ? '1 of 2' : '2 of 2'}
              </h3>
              
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="p-6 bg-gray-50">
                  <p className="text-lg text-gray-800 italic">
                    "{sentences[currentTask as RepetitionTask]}"
                  </p>
                </Card>
                
                <Button
                  onClick={() => playeSentence(sentences[currentTask as RepetitionTask])}
                  className="w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  Play Sentence
                </Button>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800 text-sm">
                    After hearing the sentence, repeat it back exactly as you heard it.
                    For this demo, click whether you repeated it correctly or not.
                  </p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <Button
                    onClick={() => handleRepetitionComplete(currentTask, true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    I Repeated Correctly
                  </Button>
                  <Button
                    onClick={() => handleRepetitionComplete(currentTask, false)}
                    variant="outline"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    I Made Errors
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Letter Fluency - Letter F
              </h3>
              
              {!fluencyStarted ? (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">F</span>
                  </div>
                  
                  <p className="text-gray-700">
                    You have 60 seconds to name as many words as possible that begin with the letter F.
                  </p>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Rules:</strong> No proper nouns (names, places) and no same word with different endings.
                    </p>
                  </div>
                  
                  <Button
                    onClick={startFluencyTask}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  >
                    Start Timer
                  </Button>
                </div>
              ) : (
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Timer className="w-6 h-6 text-gray-600" />
                    <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                      {timeLeft}s
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentWord}
                        onChange={(e) => setCurrentWord(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Type a word starting with F"
                        disabled={timeLeft === 0}
                      />
                      <Button
                        onClick={addFluencyWord}
                        disabled={!currentWord.trim() || !currentWord.toLowerCase().startsWith('f') || timeLeft === 0}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        Words: {fluencyWords.length}
                      </p>
                    </div>
                    
                    {fluencyWords.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                        {fluencyWords.map((word, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                            {word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {timeLeft === 0 && (
                    <Button
                      onClick={completeFluencyTask}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Complete Language Section
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}