import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, Volume2, CheckCircle2, XCircle, Timer, MicOff } from 'lucide-react';
import { transcribeAudioWithAzure } from '@/lib/azure-speech-config';

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
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [hasPlayedSentence, setHasPlayedSentence] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
      setHasPlayedSentence(true);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        try {
          const wavBlob = await convertToWav(audioBlob);
          await transcribeAudio(wavBlob);
        } catch (error) {
          console.error('Audio processing error:', error);
          setTranscription('Error processing audio. Please try again.');
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    }
  };

  // Convert audio to WAV format
  const convertToWav = async (audioBlob: Blob): Promise<Blob> => {
    if (audioBlob.type === 'audio/wav') {
      return audioBlob;
    }
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      return audioBufferToWav(audioBuffer);
    } catch (error) {
      console.error('Audio conversion error:', error);
      throw new Error('Failed to convert audio to WAV format');
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (audioBuffer: AudioBuffer): Blob => {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    
    const buffer = audioBuffer.getChannelData(0);
    const dataLength = buffer.length * numberOfChannels * bytesPerSample;
    const arrayBuffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);
    
    // Convert float samples to 16-bit PCM
    const data = new Int16Array(arrayBuffer, 44);
    let offset = 0;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      data[offset++] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  // Transcribe audio using Azure OpenAI
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const transcribedText = await transcribeAudioWithAzure(audioBlob);
      setTranscription(transcribedText);
      setIsTranscribing(false);
    } catch (error) {
      console.error('Transcription error:', error);
      // Fallback for demo if API fails
      setTranscription('Error: Unable to transcribe audio. Please try again.');
      setIsTranscribing(false);
    }
  };

  // Check if transcription matches the target sentence
  const checkSentenceAccuracy = (transcribed: string, target: string): boolean => {
    // Normalize text for comparison
    const normalizeText = (text: string) => 
      text.toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .replace(/\s+/g, ' ')    // Normalize whitespace
          .trim();
    
    const normalizedTranscribed = normalizeText(transcribed);
    const normalizedTarget = normalizeText(target);
    
    // Split into words
    const transcribedWords = normalizedTranscribed.split(' ').filter(w => w.length > 0);
    const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0);
    
    // Count exact matches
    let exactMatches = 0;
    let positionMatches = 0;
    
    targetWords.forEach((targetWord, index) => {
      // Check if word exists anywhere in transcription
      if (transcribedWords.includes(targetWord)) {
        exactMatches++;
        // Check if it's in the correct position
        if (transcribedWords[index] === targetWord) {
          positionMatches++;
        }
      }
    });
    
    // Calculate accuracy score
    const wordAccuracy = exactMatches / targetWords.length;
    const positionAccuracy = positionMatches / targetWords.length;
    
    // Weighted score: 70% for having the right words, 30% for correct order
    const overallAccuracy = (wordAccuracy * 0.7) + (positionAccuracy * 0.3);
    
    // Consider it correct if overall accuracy is at least 80%
    return overallAccuracy >= 0.8;
  };

  const handleRepetitionComplete = () => {
    const currentSentence = sentences[currentTask as RepetitionTask];
    const isCorrect = checkSentenceAccuracy(transcription, currentSentence);
    
    const result: TaskResult = {
      task: currentTask,
      score: isCorrect ? 1 : 0
    };
    setResults([...results, result]);
    
    // Reset states for next task
    setTranscription('');
    setHasPlayedSentence(false);
    
    if (currentTask === 'repetition1') {
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    Listen carefully to the sentence, then repeat it back exactly as you heard it.
                    Click "Play Sentence" to hear it, then use the microphone to record your repetition.
                  </p>
                </div>
                
                <Button
                  onClick={() => playeSentence(sentences[currentTask as RepetitionTask])}
                  className="w-full max-w-sm mx-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Volume2 className="w-5 h-5 mr-2" />
                  Play Sentence
                </Button>
                
                {hasPlayedSentence && (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isTranscribing}
                        className={`px-8 py-4 text-lg ${
                          isRecording 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {isRecording ? (
                          <>
                            <MicOff className="w-6 h-6 mr-2" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-6 h-6 mr-2" />
                            Start Recording
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {isRecording && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-red-600">
                          <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                          <span className="font-medium">Recording... Speak now</span>
                        </div>
                      </div>
                    )}
                    
                    {isTranscribing && (
                      <div className="text-center">
                        <div className="inline-flex items-center gap-2 text-blue-600">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-medium">Processing audio...</span>
                        </div>
                      </div>
                    )}
                    
                    {transcription && !isTranscribing && (
                      <Card className="p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-900 mb-2">Your Recording:</h4>
                        <p className="text-gray-700 italic mb-3">"{transcription}"</p>
                        
                        {/* Show accuracy indicator */}
                        {(() => {
                          const isAccurate = checkSentenceAccuracy(
                            transcription, 
                            sentences[currentTask as RepetitionTask]
                          );
                          return (
                            <div className={`mb-4 p-3 rounded-lg ${
                              isAccurate ? 'bg-green-100 border border-green-200' : 'bg-yellow-100 border border-yellow-200'
                            }`}>
                              <p className={`text-sm font-medium ${
                                isAccurate ? 'text-green-800' : 'text-yellow-800'
                              }`}>
                                {isAccurate 
                                  ? '✓ Good repetition! The key words and structure are correct.'
                                  : '⚠ Some differences detected. You can try again or continue.'}
                              </p>
                            </div>
                          );
                        })()}
                        
                        <div className="mt-4 flex gap-4 justify-center">
                          <Button
                            onClick={handleRepetitionComplete}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Continue to Next
                          </Button>
                          <Button
                            onClick={() => {
                              setTranscription('');
                              setHasPlayedSentence(true);
                            }}
                            variant="outline"
                          >
                            Try Again
                          </Button>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
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