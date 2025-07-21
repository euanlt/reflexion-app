"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mic, MicOff, Play, Square } from 'lucide-react';

interface SpeechAnalysisProps {
  onComplete?: (data: any) => void;
  isCompleted?: boolean;
}

export function SpeechAnalysis({ onComplete, isCompleted }: SpeechAnalysisProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const questions = [
    "How are you feeling today?",
    "Tell me about something that made you happy recently.",
    "What did you have for breakfast this morning?"
  ];

  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        analyzeAudio(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const analyzeAudio = (blob: Blob) => {
    // Simple speech analysis
    const wordCount = transcript.trim().split(/\s+/).length;
    const speakingTime = blob.size / 16000; // Rough estimate
    const wordsPerMinute = speakingTime > 0 ? (wordCount / speakingTime) * 60 : 0;
    
    const analysis = {
      wordCount,
      wordsPerMinute: Math.round(wordsPerMinute),
      transcriptLength: transcript.length,
      timestamp: new Date().toISOString(),
      question: questions[currentQuestion]
    };
    
    setAnalysisData(analysis);
    onComplete?.(analysis);
  };

  const playRecording = () => {
    if (audioBlob) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      
      audio.play();
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setTranscript('');
      setAudioBlob(null);
      setAnalysisData(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="senior-card">
        <div className="text-center">
          <h3 className="text-senior-lg font-bold mb-4">
            Question {currentQuestion + 1} of {questions.length}
          </h3>
          <div className="p-6 bg-blue-50 rounded-2xl mb-6">
            <p className="text-senior-base font-medium text-blue-900">
              "{questions[currentQuestion]}"
            </p>
          </div>
          
          <div className="space-y-4">
            {!isRecording && !audioBlob && (
              <Button
                onClick={startRecording}
                className="senior-button gradient-primary border-0 text-white"
                size="lg"
              >
                <Mic className="w-6 h-6 mr-3" />
                Start Recording
              </Button>
            )}
            
            {isRecording && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-senior-base font-medium">Recording...</span>
                </div>
                <Button
                  onClick={stopRecording}
                  className="senior-button bg-red-500 hover:bg-red-600 text-white"
                  size="lg"
                >
                  <Square className="w-6 h-6 mr-3" />
                  Stop Recording
                </Button>
              </div>
            )}
            
            {audioBlob && (
              <div className="space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={playRecording}
                    disabled={isPlaying}
                    variant="outline"
                    className="senior-button"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    {isPlaying ? 'Playing...' : 'Play Recording'}
                  </Button>
                  
                  {isPlaying && (
                    <Button
                      onClick={stopPlayback}
                      variant="outline"
                      className="senior-button"
                    >
                      <Square className="w-6 h-6 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>
                
                {analysisData && (
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-800 font-medium mb-2">Analysis Complete ✓</p>
                    <p className="text-xs text-green-700">
                      Words spoken: {analysisData.wordCount} | 
                      Speaking pace: {analysisData.wordsPerMinute} words/min
                    </p>
                  </div>
                )}
                
                {currentQuestion < questions.length - 1 ? (
                  <Button
                    onClick={nextQuestion}
                    className="senior-button w-full"
                  >
                    Next Question
                  </Button>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-blue-800 font-medium">
                      ✓ Voice activity completed successfully!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
      
      {transcript && (
        <Card className="senior-card">
          <h4 className="font-bold mb-3">What you said:</h4>
          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-senior-base">{transcript}</p>
          </div>
        </Card>
      )}
    </div>
  );
}