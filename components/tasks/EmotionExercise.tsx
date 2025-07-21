"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CheckCircle, Smile } from 'lucide-react';
import { FaceDetection } from '@/components/ai/FaceDetection';

interface EmotionExerciseProps {
  onComplete?: (data: any) => void;
  isCompleted?: boolean;
}

const EMOTIONS = [
  { name: 'Happy', emoji: '😊', instruction: 'Show me a big smile!' },
  { name: 'Surprised', emoji: '😲', instruction: 'Look surprised - raise your eyebrows!' },
  { name: 'Calm', emoji: '😌', instruction: 'Take a deep breath and relax your face' },
];

export function EmotionExercise({ onComplete, isCompleted }: EmotionExerciseProps) {
  const [currentEmotion, setCurrentEmotion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [completedEmotions, setCompletedEmotions] = useState<number[]>([]);
  const [faceData, setFaceData] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);

  const emotion = EMOTIONS[currentEmotion];

  const handleStartExercise = () => {
    setShowCamera(true);
    setIsRecording(true);
    
    // Auto-complete after 5 seconds of recording
    setTimeout(() => {
      if (isRecording) {
        handleEmotionComplete();
      }
    }, 5000);
  };

  const handleFaceDetection = (faces: any[]) => {
    if (isRecording) {
      setFaceData(prev => [...prev.slice(-30), ...faces]); // Keep last 30 frames
    }
  };

  const handleEmotionComplete = () => {
    setIsRecording(false);
    const newCompleted = [...completedEmotions, currentEmotion];
    setCompletedEmotions(newCompleted);
    
    // Move to next emotion or complete
    if (currentEmotion < EMOTIONS.length - 1) {
      setTimeout(() => {
        setCurrentEmotion(currentEmotion + 1);
        setFaceData([]);
      }, 2000);
    } else {
      // All emotions completed
      // Calculate score based on face detection rate
      const detectionRate = faceData.length > 0 ? Math.min(100, (faceData.length / 30) * 100) : 80;
      const exerciseData = {
        score: detectionRate,
        completedEmotions: EMOTIONS.length,
        faceDataPoints: faceData.length,
        timestamp: new Date().toISOString()
      };
      onComplete?.(exerciseData);
    }
  };

  const allCompleted = completedEmotions.length === EMOTIONS.length;

  if (allCompleted) {
    return (
      <Card className="senior-card">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
          <h3 className="text-senior-lg font-bold mb-4">
            Facial Exercise Complete!
          </h3>
          <p className="text-senior-base text-gray-600 mb-6">
            You successfully practiced all {EMOTIONS.length} facial expressions.
          </p>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            {EMOTIONS.map((emotion, index) => (
              <div key={index} className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="text-4xl mb-2">{emotion.emoji}</div>
                <p className="text-sm font-medium text-green-800">{emotion.name}</p>
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mt-2" />
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-800 font-medium">
              ✓ Facial expression exercise completed successfully!
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="senior-card">
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <Smile className="w-8 h-8 text-yellow-600 mr-3" />
          <h3 className="text-senior-lg font-bold">Facial Expression Exercise</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-senior-base text-gray-600 mb-4">
            Expression {currentEmotion + 1} of {EMOTIONS.length}
          </p>
          
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 mb-6">
            <div className="text-8xl mb-4">{emotion.emoji}</div>
            <h4 className="text-senior-lg font-bold text-gray-800 mb-2">{emotion.name}</h4>
            <p className="text-senior-base text-gray-700">{emotion.instruction}</p>
          </div>
        </div>

        {!showCamera && (
          <div className="space-y-4">
            <p className="text-senior-base text-gray-600">
              Position your face in front of the camera and try the expression shown above.
            </p>
            <Button
              onClick={handleStartExercise}
              className="senior-button gradient-primary border-0 text-white"
              size="lg"
            >
              <Camera className="w-6 h-6 mr-3" />
              Start Exercise
            </Button>
          </div>
        )}

        {showCamera && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FaceDetection 
                onDetection={handleFaceDetection}
                width={280}
                height={210}
              />
            </div>
            
            {isRecording && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-800 font-medium">Recording your expression...</span>
                </div>
                <p className="text-sm text-blue-700">
                  Hold the "{emotion.name}" expression for a few seconds
                </p>
              </div>
            )}
            
            {completedEmotions.includes(currentEmotion) && (
              <div className="p-4 bg-green-50 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium">Great job on "{emotion.name}"!</p>
                {currentEmotion < EMOTIONS.length - 1 && (
                  <p className="text-sm text-green-700 mt-1">Moving to next expression...</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress indicator */}
        <div className="mt-6 flex justify-center space-x-2">
          {EMOTIONS.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                completedEmotions.includes(index)
                  ? 'bg-green-500'
                  : index === currentEmotion
                  ? 'bg-blue-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}