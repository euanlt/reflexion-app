"use client";

import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';

interface FaceDetectionProps {
  onDetection?: (faces: any[]) => void;
  width?: number;
  height?: number;
}

export function FaceDetection({ onDetection, width = 320, height = 240 }: FaceDetectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [detector, setDetector] = useState<faceDetection.FaceDetector | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let animationId: number;
    
    const setupCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: width,
            height: height,
            facingMode: 'user'
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          setStream(mediaStream);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    const loadModel = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detectorConfig = {
          runtime: 'tfjs' as const,
        };
        const faceDetector = await faceDetection.createDetector(model, detectorConfig);
        setDetector(faceDetector);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading face detection model:', error);
        setIsLoading(false);
      }
    };

    const detectFaces = async () => {
      if (detector && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx && video.readyState === 4) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const faces = await detector.estimateFaces(video);
            onDetection?.(faces);
            
            // Draw face boundaries
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            
            faces.forEach((face) => {
              const { xMin, yMin, width, height } = face.box;
              ctx.strokeRect(xMin, yMin, width, height);
            });
          } catch (error) {
            console.error('Error detecting faces:', error);
          }
        }
      }
      
      animationId = requestAnimationFrame(detectFaces);
    };

    setupCamera();
    loadModel();

    const startDetection = () => {
      if (!isLoading && detector) {
        detectFaces();
      }
    };

    const timer = setInterval(() => {
      if (!isLoading && detector) {
        startDetection();
        clearInterval(timer);
      }
    }, 100);

    return () => {
      clearInterval(timer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [detector, isLoading, onDetection, width, height, stream]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width, height }}
        className="rounded-lg"
      />
      <canvas
        ref={canvasRef}
        style={{ width, height }}
        className="absolute top-0 left-0 rounded-lg"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading camera...</p>
          </div>
        </div>
      )}
    </div>
  );
}