"use client";

import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

interface AIModelLoaderProps {
  onModelReady?: (isReady: boolean) => void;
  children?: React.ReactNode;
}

export function AIModelLoader({ onModelReady, children }: AIModelLoaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setProgress(10);
        
        // Initialize TensorFlow.js
        await tf.ready();
        setProgress(30);
        
        // Set backend to WebGL for better performance
        await tf.setBackend('webgl');
        setProgress(50);
        
        // Warm up the backend
        const warmupTensor = tf.zeros([1, 224, 224, 3]);
        await warmupTensor.data();
        warmupTensor.dispose();
        setProgress(80);
        
        setProgress(100);
        setIsLoading(false);
        onModelReady?.(true);
        
      } catch (err) {
        console.error('Error loading AI models:', err);
        setError('Failed to load AI models. Some features may not work properly.');
        setIsLoading(false);
        onModelReady?.(false);
      }
    };

    loadModels();
  }, [onModelReady]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading AI Models</h3>
        <p className="text-gray-600 text-center mb-4">
          Preparing cognitive assessment tools...
        </p>
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-red-600 text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">AI Models Unavailable</h3>
        <p className="text-red-700 text-center mb-4">{error}</p>
        <p className="text-sm text-gray-600 text-center">
          You can still use the app, but some assessment features may be limited.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}